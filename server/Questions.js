
var loggerUtils = require('./LoggerUtils.js');
var logger = loggerUtils.getAppLogger();

var elasticUtils = require('./ElasticUtils.js');
var rabbitUtils = require('./RabbitmqUtils.js');

var RABBITMQ_ADD_QUESTIONS = rabbitUtils.RABBITMQ_ADD_QUESTIONS;
var RABBITMQ_ADD_ANSWERS = rabbitUtils.RABBITMQ_ADD_ANSWERS;
var QUESTIONS_QUEUE = rabbitUtils.QUESTIONS_QUEUE;
var ANSWERS_QUEUE =  rabbitUtils.ANSWERS_QUEUE;
var ES_QUEUE = rabbitUtils.ES_QUEUE;

const util = require('util');
var mongoUtil = require('./MongoUtils.js');
var cassandraUtils = require('./CassandraUtils.js');
var cassandraKeyspace = cassandraUtils.cassandraKeyspace;
var cassandraTable = cassandraUtils.cassandraTable;
var cassandraFullName = cassandraUtils.cassandraFullName;

let constants = require('./Utils.js');
const STATUS_OK = constants.STATUS_OK;
const STATUS_ERROR = constants.STATUS_ERROR;

const COLLECTION_USERS = constants.COLLECTION_USERS;
const COLLECTION_COOKIES = constants.COLLECTION_COOKIES;
const COLLECTION_QUESTIONS = constants.COLLECTION_QUESTIONS;
const COLLECTION_ANSWERS = constants.COLLECTION_ANSWERS;
const COLLECTION_IP_VIEWS = constants.COLLECTION_IP_VIEWS;
const COLLECTION_USER_VIEWS = constants.COLLECTION_USER_VIEWS;
const COLLECTION_MEDIA = constants.COLLECTION_MEDIA;
const COLLECTION_MEDIA_USER = constants.COLLECTION_MEDIA_USER;

var getRandomIdString = constants.getRandomIdString;
var getUnixTime = constants.getUnixTime;


module.exports = function(app) {

    app.get('/questions/:id', async function(req, res) {
        try {
            var id = req.params.id;
            var ip = req.ip;
            var db = mongoUtil.getDB();
            
            var questionQuery = { questionId: id };
            var questionDoc = await db.collection(COLLECTION_QUESTIONS).findOne(questionQuery);
            
            if (questionDoc != null) {
                var cookie = req.cookies['SessionID'];
                var username;
                if (cookie != undefined) {
                    // username = await mongoUtil.getUserForCookie(cookie);
                    let temp = await mongoUtil.getUserAndIdForCookie(cookie);
                    if (temp != null) {
                        username = temp.username;
                    }
                }

                var numViews = questionDoc.view_count;
                var ipAlreadyExists = false;
                var userViewExists = false;
                if (username == null) {
                    // If not logged in, check to increment view_count for ip.
                    var ipQuery = { ip: ip, questionId: id };
                    ipAlreadyExists = await db.collection(COLLECTION_IP_VIEWS).findOne(ipQuery)
                                                    .then(function(ipDoc) {
                                                        return ipDoc != null;
                                                    });
                    if (ipAlreadyExists) {
                        logger.debug(ip + " already exists for questionId: " + id);
                    }
                    else {
                        let insertIpResult = await db.collection(COLLECTION_IP_VIEWS).insertOne(ipQuery);
                        logger.debug("Insert Ip Result: " + insertIpResult);
                    }
                }
                else {
                    // If logged in, check to increment view_count for user.
                    var userQuery = { username: username, questionId: id };
                    userViewExists = await db.collection(COLLECTION_USER_VIEWS).findOne(userQuery)
                                                    .then(function(userViewDoc) {
                                                        return userViewDoc != null;
                                                    });
                    if (userViewExists) {
                        logger.debug(username + " already viewed questionId: " + id);
                    }
                    else {
                        let insertUserViewResult = await db.collection(COLLECTION_USER_VIEWS).insertOne(userQuery);
                        logger.debug("Insert user view result: " + insertUserViewResult);
                    }
                }

                if (!ipAlreadyExists && !userViewExists) {
                    // let updateCountQuery = {$set: {view_count: numViews+1}};
                    let updateCountQuery = { $inc: {view_count: 1} };
                    numViews++;
                    let updateViewsResult = await db.collection(COLLECTION_QUESTIONS).updateOne(questionQuery, updateCountQuery);
                }

                let userIdPosterQuery = { userId: questionDoc.userId };
                let userDoc = await db.collection(COLLECTION_USERS).findOne(userIdPosterQuery);

                var searchSuccess = false;
                var question;

                if (userDoc == null) {
                    logger.debug("Either the question with id: " + id + " does not exist or the user who posted it could not be found.");
                    searchSuccess = false;
                }
                else {
                    searchSuccess = true;
                    question = {
                        id: questionDoc.questionId, user: { username: userDoc.username, reputation: userDoc.reputation },
                        title: questionDoc.title, body: questionDoc.body, score: questionDoc.score, view_count: numViews,
                        answer_count: questionDoc.answer_count, timestamp: questionDoc.timestamp, media: questionDoc.media,
                        tags: questionDoc.tags, accepted_answer_id: questionDoc.accepted_answer_id
                    };
                }

                if (searchSuccess) {
                    res.json({status: "OK", question: question});
                }
                else {
                    res.status(400).json({status: "error", questions: null, error: "Failed to get question with ID: " + id});
                }
            }
            else {
                // Question doesn't exist.
                logger.debug("No question with id: " + id);
                res.status(400).json({status: "error", error: "No question with id: " + id});
            }
        }
        catch (error) {
            logger.debug("async/await error in /questions/:id. Error: " + error);
            res.status(400).json({status: "error", error: "Unable to get question."});
        }
    });

    app.post('/questions/add', async function(req, res) {
        var rabbitConnection = rabbitUtils.getConnection();
        var rabbitChannel = rabbitUtils.getChannel();
        var db = mongoUtil.getDB();
        try {
            logger.debug("/questions/add");
            var title = req.body.title;
            var body = req.body.body;
            var tags = req.body.tags; // Array of tags (strings)
            var media = req.body.media;

            var cookie = req.cookies['SessionID'];
            const authErrorMessage = "QUESTION_ADD_ERROR: User is not logged in. Must be logged in to add a question.";

            logger.debug("/////////////////////////////");
            // logger.debug("title: " + title);
            // logger.debug("body: " + body);
            // logger.debug("tags: " + tags);
            // logger.debug("media: " + media);
            // logger.debug("cookie: " + cookie);

            var user = await mongoUtil.getUserAndIdForCookie(cookie);
            
            if (user == null) {
                // Not logged in. Fail.
                logger.debug(authErrorMessage);
                res.status(401).json({status: "error", error: authErrorMessage});
                return;
            }

            var userId = user.userId;
            var username = user.username;
            // var userId = await mongoUtil.getIdForCookie(cookie);
            
            if (title == null || body == null || tags == null) {
                let validValuesMsg = "QUESTION_ADD_ERROR: Title, body, and tags must all have valid values for /questions/add.";
                logger.debug(validValuesMsg);
                res.status(400).json({status: "error", error: validValuesMsg});
                return;
            }

            if (media != null) {
                for (let i = 0; i < media.length; i++) {
                    // let mediaIdQuery = {_id: {$in: media} };
                    let mediaIdQuery = {_id: media[i]};
                    let result = await db.collection(COLLECTION_MEDIA).findOne(mediaIdQuery);
                    if (result != null) {
                        logger.debug("QUESTION_ADD_ERROR: can't use media from other Q/A's");
                        res.status(400).json({status: "error", error: "A question can't use media from other Q/A's."});
                        return;
                    }

                    result = await db.collection(COLLECTION_MEDIA_USER).findOne(mediaIdQuery);
                    if (result != null) {
                        if (userId != result.userId) {
                            logger.debug("QUESTION_ADD_ERROR: can't use media from other user");
                            res.status(400).json({status: "error", error: "A question can't use media from other users."});
                            return;
                        }
                        else {
                            logger.debug("Media belongs to user attempting to add question.");
                        }
                    }
                }
            }

            var questionId = getRandomIdString();   
            var timestamp = getUnixTime();

            // Add media to questionId relationship
            // var qMediaDocs = [];
            // if (media != null) {
            //     media.forEach(function(mediaId) {
            //         qMediaDocs.push({_id: mediaId, qa: questionId}); 
            //     });
            // }

            // if (qMediaDocs.length > 0) {
            //     db.collection(COLLECTION_MEDIA).insertMany(qMediaDocs, {ordered: false})
            //     // db.collection(COLLECTION_MEDIA).updateMany({_id: {$in: qMediaDocs} }, { $set: {qaId: questionId} })
            //     .then(function(ret) {
            //         // logger.debug("Insert many Q media IDs: " + ret);
            //     })
            //     .catch(function(error) {
            //         logger.debug("Error inserting Q media IDs: " + error);
            //     });
            // }

            // Rabbit MQ Message
            logger.debug("Sending /questions/add to RabbitMQ: questionId: " + questionId);
            var msg = {title: title, body: body, questionId: questionId, tags: tags,
                        userId: userId, timestamp: timestamp, media: media, username: username};

            rabbitChannel.sendToQueue(QUESTIONS_QUEUE, Buffer.from(JSON.stringify(msg))/*, {persistent: true}*/);

            var es_msg = {title: title, body: body, questionId: questionId, tags: tags}

            rabbitChannel.sendToQueue(ES_QUEUE, Buffer.from(JSON.stringify(es_msg)));

            res.json({status: "OK", id: questionId, error: null});
        }
        catch (error) {
            logger.debug("QUESTION_ADD_ERROR: Error in /questions/add async/await: " + error);
            res.status(400).json({status: "error", error: "async/await error. Failed to add question."});
        }
    });

    app.post('/questions/:id/answers/add', async function(req, res) {
        try {
            var rabbitConnection = rabbitUtils.getConnection();
            var rabbitChannel = rabbitUtils.getChannel();
            var db = mongoUtil.getDB();

            var id = req.params.id;
            var body = req.body.body;
            var media = req.body.media;

            var cookie = req.cookies['SessionID'];
            const authErrorMessage = "ANSWER_ADD_ERROR: User is not logged in. Must be logged in to add an answer.";

            var user = await mongoUtil.getUserAndIdForCookie(cookie);

            // var userId = await mongoUtil.getIdForCookie(cookie);
            if (user == null) {
                // Not logged in. Fail.
                logger.debug(authErrorMessage);
                res.status(401).json({status: "error", error: authErrorMessage});
                return;
            }

            var userId = user.userId;
            var username = user.username;

            if (media != null) {
                for (let i = 0; i < media.length; i++) {
                    // let mediaIdQuery = {_id: {$in: media} };
                    let mediaIdQuery = {_id: media[i]};
                    let result = await db.collection(COLLECTION_MEDIA).findOne(mediaIdQuery);
                    if (result != null) {
                        logger.debug("ANSWER_ADD_ERROR: can't use media from other Q/A's");
                        res.status(400).json({status: "error", error: "An answer can't use media from other Q/A's."});
                        return;
                    }

                    result = await db.collection(COLLECTION_MEDIA_USER).findOne(mediaIdQuery);
                    if (result != null) {
                        if (userId != result.userId) {
                            logger.debug("ANSWER_ADD_ERROR: can't use media from other user");
                            res.status(400).json({status: "error", error: "An answer can't use media from other users."});
                            return;
                        }
                        else {
                            logger.debug("Media belongs to user attempting to add answer.");
                        }
                    }
                }
            }

                
            var answerId = getRandomIdString();
            let timestamp = getUnixTime();

            // Add media to answer relationship
            // var aMediaDocs = [];
            // if (media != null) {
            //     media.forEach(function(mediaId) {
            //         aMediaDocs.push({_id: mediaId, qa: answerId}); 
            //     });
            // }

            // if (aMediaDocs.length > 0) {
            //     db.collection(COLLECTION_MEDIA).insertMany(aMediaDocs, {ordered: false})
            //     // db.collection(COLLECTION_MEDIA).updateMany({_id: {$in: aMediaDocs} }, { $set: {qaId: answerId} })
            //     .then(function(ret) {
            //         // logger.debug("Insert many A media IDs: " + ret);
            //     })
            //     .catch(function(error) {
            //         logger.debug("Error inserting A media IDs: " + error);
            //     });
            // }



            // Send RabbitMQ message
            logger.debug("Sending /answers/add to RabbitMQ: questionId: " + answerId);
            var msg = {answerId: answerId, questionId: id, body: body, media: media, userId: userId,
                        timestamp: timestamp, username: username};
        
            rabbitChannel.sendToQueue(ANSWERS_QUEUE, Buffer.from(JSON.stringify(msg))/*, {persistent: true}*/);


            res.json({status: "OK", id: answerId});
        }
        catch (error) {
            logger.debug("Unable to  add answer with questionId: " + req.params.id);
            res.status(400).json({status: "error", error: "Unable to  add answer with questionId: " + req.params.id});
        }
    });

    app.get('/questions/:id/answers', async function(req, res) {
        try {
            var id = req.params.id;

            var answersQuery = { questionId: id };

            var answers = [];

            var db = mongoUtil.getDB();

            var cursor = await db.collection(COLLECTION_ANSWERS).find(answersQuery);
            while (await cursor.hasNext()) {
                let answerDoc = await cursor.next();
                let userDoc = await db.collection(COLLECTION_USERS).findOne({userId: answerDoc.userId});
                if (userDoc == null) {
                    logger.debug("[/questions/:id/answers] - The user doc with userId: " + answerDoc.userId + " does not exist, Answer Doc: " + answerDoc.answerId);
                }
                let answer = {
                                id: answerDoc.answerId, user: userDoc.username, body: answerDoc.body, score: answerDoc.score,
                                is_accepted: answerDoc.accepted, timestamp: answerDoc.timestamp, media: answerDoc.media
                            };
                answers.push(answer);
            }

            res.json({status: "OK", answers: answers});
        }
        catch (error) {
            logger.debug("Error: " + error);
            res.status(400).json({status: "error", questions: null, error: "Failed to get answers for question with ID: " + id});
        }
    });

    app.delete('/questions/:id', async function(req, res) {
        var db = mongoUtil.getDB();
        var cassandraClient = cassandraUtils.getCassandraClient();
        var elasticClient = elasticUtils.getElasticClient();
        var qid = req.params.id;
        logger.debug("-------------------------------");
        logger.debug("/questions/" + qid);
        var headerSent = false;
        try {
            var cookie = req.cookies['SessionID'];
            const errorMessage = "You are not logged in as the proper user to delete question: " + qid + ".";

            if (cookie == undefined) {
                res.status(401).json({status: "error", error: errorMessage})
                return;
            }

            var user = await mongoUtil.getUserAndIdForCookie(cookie);
            if (!user) {
                res.status(401).json({status: "error", error: errorMessage});
                return;
            }

            // var userId = user.userId;

            let questionIdQuery = { questionId: qid };
            var questionDoc = await db.collection(COLLECTION_QUESTIONS).findOne(questionIdQuery);
            logger.debug("questionDoc == null: " + (questionDoc == null));
            
            if (questionDoc != null) {
                logger.debug("questionDoc.questionId: " + questionDoc.questionId);
            }

            if (questionDoc == null) {
                res.status(400).json({status: "error", error: "The question to be deleted does not exist."});
                return;
            }
            else if (questionDoc.userId != user.userId) {
                res.status(401).json({status: "error", error: "You must be the poster of the question to delete it."});
                return;
            }
            else {
                var query = "DELETE FROM " + cassandraFullName + " WHERE id=? IF EXISTS";

                if (questionDoc.media != null && questionDoc.media.length > 0) {
                    questionDoc.media.forEach(function(mediaId) {
                        let deleteMediaQuery = {_id: mediaId};
                        db.collection(COLLECTION_MEDIA).deleteMany(deleteMediaQuery);
                        db.collection(COLLECTION_MEDIA_USER).deleteMany(deleteMediaQuery);
                        cassandraClient.execute(query, [mediaId], {prepare: true})
                        .then(function(result) {
                            logger.debug("Deleting question media file id: " + mediaId + ", result: " + result);
                        })
                        .catch(function(error) {
                            logger.debug("Error deleting question media: " + error);
                        });
                    });
                }

                db.collection(COLLECTION_QUESTIONS).deleteOne(questionIdQuery)
                .then(function(ret) {
                    if (ret == null) return;
                    let result = ret.result;
                    logger.debug("Deleted question: n=" + result.n + ", ok=" + result.ok);
    
                    if (result.n != 1 || result.ok != 1) {
                        res.status(401).json({status: "error", error: "Failed to delete the question."});
                        headerSent = true;
                    }
                    else {
                        res.status(200).json(STATUS_OK);
                        headerSent = true;
                    }
                })
                .catch(function(error) {
                    logger.debug("Failed to delete media associated with question and question. Error: " + error);
                });

                elasticClient.deleteByQuery({
                    index: 'questions',
                    // refresh: true,
                    body: {
                        query: {
                            match: {
                                id: qid
                            }
                        }
                    }
                })
                .then(function(ret) {
                    logger.debug("[/questions/:id] - Return value of deleting ES question with id " + qid + ": " + ret);
                })
                .catch(function(error) {
                    logger.debug("[/questions/:id] - Failed to delete ES question with id " + qid + ": " + error);
                });


                let cursor = await db.collection(COLLECTION_ANSWERS).find(questionIdQuery);

                while (await cursor.hasNext()) {
                    let answerDoc = await cursor.next();
                    if (answerDoc.media != null && answerDoc.media.length > 0) {
                        answerDoc.media.forEach(function(mediaId) {
                            let deleteMediaQuery = {_id: mediaId};
                            db.collection(COLLECTION_MEDIA).deleteMany(deleteMediaQuery);
                            db.collection(COLLECTION_MEDIA_USER).deleteMany(deleteMediaQuery);

                            cassandraClient.execute(query, [mediaId], {prepare: true})
                            .then(function(result) {
                                logger.debug("Deleting answer media file id: " + mediaId + ", result: " + result);
                            })
                            .catch(function(error) {
                                logger.debug("Error deleting answer media: " + error);
                            });
                        });
                    }
                }

                db.collection(COLLECTION_ANSWERS).deleteMany(questionIdQuery)
                .then(function(result) {
                    logger.debug("Deleted " + result.result.n + " documents.");
                })
                .catch(function(error) {
                    logger.debug("Failed to delete answers associated with questionId: " + qid + ", Error: " + error);
                });
            }
        }
        catch (error) {
            logger.debug("Error: " + error);
            if (!headerSent) {
                res.status(401).json({status: "error", error: "Failed to delete question with ID: " + qid});
            }
        }
    });

    app.post('/answers/:id/accept', async function(req, res) {
        var id = req.params.id;
        logger.debug("/answers/" + id + "/accept");
        
        var cookie = req.cookies['SessionID'];
        const authErrorMessage = "Must be logged in to accept an answer.";

        // Check to see if logged in first.
        var user = await mongoUtil.getUserAndIdForCookie(cookie);
        if (user == null) {
            // Not logged in. Fail.
            logger.debug(authErrorMessage);
            res.status(401).json(STATUS_ERROR);
            return;
        }

        var db = mongoUtil.getDB();

        let answerQuery = { answerId: id };
        let answerDoc = await db.collection(COLLECTION_ANSWERS).findOne(answerQuery);
        if (answerDoc == null) {
            logger.debug("Answer with ID: " + id + " does not exist");
            res.status(400).json(STATUS_ERROR);
            return;
        }

        let questionQuery = {questionId: answerDoc.questionId};
        let questionDoc = await db.collection(COLLECTION_QUESTIONS).findOne(questionQuery);
        if (questionDoc == null) {
            logger.debug("Question " + answerDoc.questionId + " associated with answer " + id + " could not be found.");
            res.status(400).json(STATUS_ERROR);
            return;
        }

        if (questionDoc.userId != user.userId) {
            logger.debug("You can only accept an answer if you posted the question.");
            res.status(401).json(STATUS_ERROR);
            return;
        }

        if (questionDoc.accepted === true) {
            logger.debug("Question already has an accepted answer with ID: " + questionDoc.accepted_answer_id);
            res.status(400).json(STATUS_ERROR);
            return;
        }
        
        // All checks done. Now accept the answer.
        let updateAnswerQuery = {$set: {accepted: true}};
        let updateQuestionQuery = {$set: {accepted: true, accepted_answer_id: id}};

        db.collection(COLLECTION_QUESTIONS).updateOne(questionQuery, updateQuestionQuery)
        .then(function(result) {
            logger.debug("Question updated with accepted status: n: " + result.result.n + ", nModified: " + result.result.nModified);
        })
        .catch(function(error) {
            logger.debug("Failed to update question with accepted status: " + error);
        });

        db.collection(COLLECTION_ANSWERS).updateOne(answerQuery, updateAnswerQuery)
        .then(function(result) {
            logger.debug("Answer updated with accepted status: n: " + result.result.n + ", nModified: " + result.result.nModified);
        })
        .catch(function(error) {
            logger.debug("Failed to update answer with accepted status: " + error);
        });

        res.json(STATUS_OK);
    });

};