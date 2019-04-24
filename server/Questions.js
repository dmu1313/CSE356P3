
var loggerUtils = require('./LoggerUtils.js');
var logger = loggerUtils.getAppLogger();

var elasticUtils = require('./ElasticUtils.js');
var rabbitUtils = require('./RabbitmqUtils.js');

var RABBITMQ_ADD_QUESTIONS = rabbitUtils.RABBITMQ_ADD_QUESTIONS;
var RABBITMQ_ADD_ANSWERS = rabbitUtils.RABBITMQ_ADD_ANSWERS;
var QUEUE_NAME = rabbitUtils.QUEUE_NAME;

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
                    username = temp.username;
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
        var elasticClient = elasticUtils.getElasticClient();
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
                    let mediaIdQuery = {mediaId: media[i]};
                    let result = await db.collection(COLLECTION_MEDIA).findOne(mediaIdQuery);
                    if (result != null) {
                        logger.debug("QUESTION_ADD_ERROR: can't use media from other Q/A's");
                        res.status(400).json({status: "error", error: "A question can't use media from other Q/A's."});
                        return;
                    }

                    result = await db.collection(COLLECTION_MEDIA_USER).findOne({_id: media[i]});
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
            var questionIdExists = true;
            

            // while (questionIdExists) {    
            //     questionId = getRandomIdString();
            //     var questionIdQuery = { questionId: questionId };
            //     questionIdExists = await db.collection(COLLECTION_QUESTIONS).findOne(questionIdQuery)
            //                             .then(function(questionDoc) {
            //                                 return questionDoc != null;
            //                             })
            //                             .catch(function(error) {
            //                                 logger.debug("Unable to check to see if we already have a question with the potentially new Id.");
            //                                 return true;
            //                             });
            // }

            var timestamp = getUnixTime();

            // logger.debug("Inserting question into ElasticSearch.");
            // Rabbit MQ Message
            logger.debug("Sending /questions/add to RabbitMQ: questionId: " + questionId);
            var msg = {t: RABBITMQ_ADD_QUESTIONS, title: title, body: body, questionId: questionId, tags: tags,
                        userId: userId, timestamp: timestamp, media: media, username: username};
        
            rabbitChannel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(msg))/*, {persistent: true}*/);

            // rabbitChannel.assertQueue(QUEUE_NAME, {durable: true})
            // .then(function(result) {
            //     rabbitChannel.sendToQueue(q, new Buffer(JSON.stringify(msg))/*, {persistent: true}*/);
            // })
            // .catch(function(err) {
            //     logger.debug("Error sending /add/question message to RabbitMQ: " + err);
            // });
            
            // elasticClient.index({
            //     index: 'questions',
            //     refresh: true,
            //     body: {
            //         title: title,
            //         body: body,
            //         id: questionId,
            //         tags: tagString
            //     }
            // })
            // .then(function(ret) {
            //     logger.debug("Return value of inserting question " + questionId + " into ElasticSearch: " + ret);
            // })
            // .catch(function(error) {
            //     logger.debug("Failed to insert question " + questionId + " into ElasticSearch. Error: " + error);
            // });

            // var has_media = (media != null);
            // var insertSuccess = false;
            // var insertQuestionQuery = {
            //                             questionId: questionId, userId: userId, title: title, body: body, score: 0,
            //                             view_count: 0, answer_count: 0, timestamp: timestamp, tags: tags, media: media,
            //                             has_media: has_media, accepted_answer_id: null, accepted: false, username: username
            //                          };
            // db.collection(COLLECTION_QUESTIONS).insertOne(insertQuestionQuery)
            // .then(function(ret) {
            //     if (ret == null) {
            //         logger.debug("Add question returned null value.");
            //         insertSuccess = false;
            //         return;
            //     }
            //     logger.debug("Add question result: " + ret);
            //     insertSuccess = true;
            // })
            // .catch(function(error) {
            //     logger.debug("Unable to add question. Error: " + error);
            //     insertSuccess = false;
            // })
            // .finally(function() {
            //     if (insertSuccess) {
            //         logger.debug("Questionid: " + questionId);
            //         res.json({status: "OK", id: questionId, error:null});
            //     }
            //     else {
            //         res.status(400).json({status: "error", error: "Failed to add question."});
            //     }
            // });
            res.json({status: "OK", id: questionId, error: null});
        }
        catch (error) {
            logger.debug("QUESTION_ADD_ERROR: Error in /questions/add async/await: " + error);
            res.status(400).json({status: "error", error: "async/await error. Failed to add question."});
        }
    });

    app.post('/questions/:id/answers/add', async function(req, res) {
        var rabbitConnection = rabbitUtils.getConnection();
        var rabbitChannel = rabbitUtils.getChannel();

        var id = req.params.id;
        var body = req.body.body;
        var media = req.body.media;

        var cookie = req.cookies['SessionID'];
        const authErrorMessage = "User is not logged in. Must be logged in to add an answer.";

        var user = await mongoUtil.getUserAndIdForCookie(cookie);
        var userId = user.userId;
        var username = user.username;
        // var userId = await mongoUtil.getIdForCookie(cookie);
        if (user == null) {
            // Not logged in. Fail.
            logger.debug(authErrorMessage);
            res.status(401).json({status: "error", error: authErrorMessage});
            return;
        }

        if (media != null) {
            for (let i = 0; i < media.length; i++) {
                let mediaIdQuery = {mediaId: media[i]};
                let result = await db.collection(COLLECTION_MEDIA).findOne(mediaIdQuery);
                if (result != null) {
                    res.status(400).json({status: "error", error: "An answer can't use media from other Q/A's."});
                }

                result = await db.collection(COLLECTION_MEDIA_USER).findOne({_id: media[i]});
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

        var answerId;
        var db = mongoUtil.getDB();

        answerId = getRandomIdString();
        let timestamp = getUnixTime();

        // Send RabbitMQ message
        logger.debug("Sending /answers/add to RabbitMQ: questionId: " + answerId);
        var msg = {t: RABBITMQ_ADD_ANSWERS, answerId: answerId, questionId: id, body: body, media: media, userId: userId,
                    timestamp: timestamp, username: username};
    
        rabbitChannel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(msg))/*, {persistent: true}*/);

        // rabbitChannel.assertQueue(QUEUE_NAME, {durable: true})
        // .then(function(result) {
        //     rabbitChannel.sendToQueue(QUEUE_NAME, new Buffer(JSON.stringify(msg))/*, {persistent: true}*/);
        // })
        // .catch(function(err) {
        //     logger.debug("Error sending /add/question message to RabbitMQ: " + err);
        // });

        res.json({status: "OK", id: answerId});


        // var answerQuery = {
        //             answerId:answerId, questionId: id, body: body, media: media, userId: userId, score: 0,
        //             accepted: false, timestamp: timestamp, username: username
        //         };

        
        // let updateQuestionsQuery = {questionId: id};
        // let incrementAnswerCountQuery = { $inc: { answer_count: 1 } };
        // db.collection(COLLECTION_QUESTIONS).updateOne(updateQuestionsQuery, incrementAnswerCountQuery);

        // var addSuccess = false;
        // db.collection(COLLECTION_ANSWERS).insertOne(answerQuery)
        // .then(function(ret) {
        //     logger.debug("Add answer result: " + ret);
        //     addSuccess = true;
        // })
        // .catch(function(error) {
        //     logger.debug("Failed to add answer. Error: " + error);
        //     addSuccess = false;
        // })
        // .finally(function() {
        //     if (addSuccess) {
        //         res.json({status: "OK", id: answerId});
        //     }
        //     else {
        //         res.status(400).json({status: "error", error: "Failed to add answer."});
        //     }
        // });
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
        var qid = req.params.id;
        logger.debug("-------------------------------");
        logger.debug("/questions/" + qid);
        try {
            var cookie = req.cookies['SessionID'];
            const errorMessage = "You are not logged in as the proper user to delete question: " + qid + ".";

            if (cookie == undefined) {
                res.status(401).json({status: "error", error: errorMessage})
                return;
            }
            
            
            var userId = (await mongoUtil.getUserAndIdForCookie(cookie)).userId;
            if (!userId) {
                res.status(401).json({status: "error", error: errorMessage})
            }
            else {
                var query = "DELETE FROM " + cassandraFullName + " WHERE id=? IF EXISTS";
                let questionIdQuery = { questionId: qid };

                db.collection(COLLECTION_QUESTIONS).findOne(questionIdQuery)
                .then(function(questionDoc) {
                    if (questionDoc == null) return;

                    questionDoc.media.forEach(function(mediaId) {
                        let deleteMediaQuery = {mediaId: mediaId};
                        db.collection(COLLECTION_MEDIA).deleteMany(deleteMediaQuery);

                        cassandraClient.execute(query, [mediaId], {prepare: true})
                        .then(function(result) {
                            logger.debug("Deleting question media file id: " + mediaId + ", result: " + result);
                        })
                        .catch(function(error) {
                            logger.debug("Error deleting question media: " + error);
                        });
                    });

                    return db.collection(COLLECTION_QUESTIONS).deleteOne(questionIdQuery);
                })
                .then(function(ret) {
                    if (ret == null) return;
                    let result = ret.result;
                    logger.debug("Deleted question: n=" + result.n + ", ok=" + result.ok);
    
                    if (result.n != 1 || result.ok != 1) {
                        res.status(401).json({status: "error", error: "Failed to delete the question."});
                    }
                    else {
                        res.status(200).json(STATUS_OK);
                    }
                })
                .catch(function(error) {
                    logger.debug("Failed to delete media associated with question and question. Error: " + error);
                });

                let cursor = await db.collection(COLLECTION_ANSWERS).find(questionIdQuery);

                while (await cursor.hasNext()) {
                    let answerDoc = await cursor.next();
                    answerDoc.media.forEach(function(mediaId) {
                        let deleteMediaQuery = {mediaId: mediaId};
                        db.collection(COLLECTION_MEDIA).deleteMany(deleteMediaQuery);

                        cassandraClient.execute(query, [mediaId], {prepare: true})
                        .then(function(result) {
                            logger.debug("Deleting answer media file id: " + mediaId + ", result: " + result);
                        })
                        .catch(function(error) {
                            logger.debug("Error deleting answer media: " + error);
                        });
                    });
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
            res.status(401).json({status: "error", rror: "Failed to delete question with ID: " + qid});
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