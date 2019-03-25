
var mongoUtil = require('./MongoUtils.js');

let constants = require('./Utils.js');
const STATUS_OK = constants.STATUS_OK;

const COLLECTION_USERS = constants.COLLECTION_USERS;
const COLLECTION_COOKIES = constants.COLLECTION_COOKIES;
const COLLECTION_QUESTIONS = constants.COLLECTION_QUESTIONS;
const COLLECTION_ANSWERS = constants.COLLECTION_ANSWERS;
const COLLECTION_IP_VIEWS = constants.COLLECTION_IP_VIEWS;
const COLLECTION_USER_VIEWS = constants.COLLECTION_USER_VIEWS;

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
                    username = await mongoUtil.getUserForCookie(cookie);
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
                        console.log(ip + " already exists for questionId: " + id);
                    }
                    else {
                        let insertIpResult = await db.collection(COLLECTION_IP_VIEWS).insertOne(ipQuery);
                        console.log("Insert Ip Result: " + insertIpResult);
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
                        console.log(username + " already viewed questionId: " + id);
                    }
                    else {
                        let insertUserViewResult = await db.collection(COLLECTION_USER_VIEWS).insertOne(userQuery);
                        console.log("Insert user view result: " + insertUserViewResult);
                    }
                }

                if (!ipAlreadyExists && !userViewExists) {
                    let updateCountQuery = {$set: {view_count: numViews+1}};
                    numViews++;
                    let updateViewsResult = await db.collection(COLLECTION_QUESTIONS).updateOne(questionQuery, updateCountQuery);
                }

                let userIdPosterQuery = { userId: questionDoc.userId };
                let userDoc = await db.collection(COLLECTION_USERS).findOne(userIdPosterQuery);

                var searchSuccess = false;
                var question;

                if (userDoc == null) {
                    console.log("Either the question with id: " + id + " does not exist or the user who posted it could not be found.");
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
                    res.json({status: "error", questions: null, error: "Failed to get question with ID: " + id});
                }
            }
            else {
                // Question doesn't exist.
                console.log("No question with id: " + id);
                res.json({status: "error", error: "No question with id: " + id});
            }
        }
        catch (error) {
            console.log("async/await error in /questions/:id. Error: " + error);
            res.json({status: "error", error: "Unable to get question."});
        }
    });

    app.post('/questions/add', async function(req, res) {
        try {
            console.log("/questions/add");
            var title = req.body.title;
            var body = req.body.body;
            var tags = req.body.tags; // Array of tags (strings)
            var media = req.body.media;

            var cookie = req.cookies['SessionID'];
            const authErrorMessage = "User is not logged in. Must be logged in to add a question.";

            console.log("/////////////////////////////");
            console.log("title: " + title);
            console.log("body: " + body);
            console.log("tags: " + tags);
            console.log("media: " + media);
            console.log("cookie: " + cookie);

            var userId = await mongoUtil.getIdForCookie(cookie);
            if (userId == null) {
                // Not logged in. Fail.
                console.log(authErrorMessage);
                res.json({status: "error", error: authErrorMessage});
                return;
            }
            if (title == null || body == null || tags == null) {
                let validValuesMsg = "Title, body, and tags must all have valid values for /questions/add.";
                console.log(validValuesMsg);
                res.json({status: "error", error: validValuesMsg});
                return;
            }

            var questionId;
            var questionIdExists = true;
            var db = mongoUtil.getDB();

            while (questionIdExists) {    
                questionId = getRandomIdString();
                var questionIdQuery = { questionId: questionId };
                questionIdExists = await db.collection(COLLECTION_QUESTIONS).findOne(questionIdQuery)
                                        .then(function(questionDoc) {
                                            return questionDoc != null;
                                        })
                                        .catch(function(error) {
                                            console.log("Unable to check to see if we already have a question with the potentially new Id.");
                                            return true;
                                        });
            }

            var timestamp = getUnixTime();

            var insertSuccess = false;
            var insertQuestionQuery = {
                                        questionId: questionId, userId: userId, title: title, body: body, score: 0,
                                        view_count: 0, answer_count: 0, timestamp: timestamp, tags: tags, media: media,
                                        accepted_answer_id: null, accepted: false
                                     };
            db.collection(COLLECTION_QUESTIONS).insertOne(insertQuestionQuery)
            .then(function(ret) {
                if (ret == null) {
                    console.log("Add question returned null value.");
                    insertSuccess = false;
                    return;
                }
                console.log("Add question result: " + ret);
                insertSuccess = true;
            })
            .catch(function(error) {
                console.log("Unable to add question. Error: " + error);
                insertSuccess = false;
            })
            .finally(function() {
                if (insertSuccess) {
                    console.log("Questionid: " + questionId);
                    res.json({status: "OK", id: questionId, error:null});
                }
                else {
                    res.json({status: "error", error: "Failed to add question."});
                }
            });
        }
        catch (error) {
            console.log("Error in /questions/add async/await: " + error);
            res.json({status: "error", error: "async/await error. Failed to add question."});
        }
    });

    app.post('/questions/:id/answers/add', async function(req, res) {
        var id = req.params.id;
        var body = req.body.body;

        var cookie = req.cookies['SessionID'];
        const authErrorMessage = "User is not logged in. Must be logged in to add an answer.";

        var userId = await mongoUtil.getIdForCookie(cookie);
        if (userId == null) {
            // Not logged in. Fail.
            console.log(authErrorMessage);
            res.json({status: "error", error: authErrorMessage});
            return;
        }

        var answerId;
        var answerIdExists = true;
        var db = mongoUtil.getDB();

        while (answerIdExists) {    
            answerId = getRandomIdString();
            var answerIdQuery = { answerId: answerId };
            answerIdExists = await db.collection(COLLECTION_ANSWERS).findOne(answerIdQuery)
                                .then(function(answerDoc) {
                                    return answerDoc != null;
                                })
                                .catch(function(error) {
                                    console.log("Unable to check to see if we already have an answer with the potentially new Id.");
                                    return true;
                                });
        }

        let timestamp = getUnixTime();
        var answerQuery = {
                    answerID:answerId, questionId: id, body: body, media: [], userId: userId, score: 0,
                    accepted: false, timestamp: timestamp
                };

        var addSuccess = false;
        db.collection(COLLECTION_ANSWERS).insertOne(answerQuery)
        .then(function(ret) {
            console.log("Add answer result: " + ret);
            addSuccess = true;
        })
        .catch(function(error) {
            console.log("Failed to add answer. Error: " + error);
            addSuccess = false;
        })
        .finally(function() {
            if (addSuccess) {
                res.json({status: "OK", id: answerId});
            }
            else {
                res.json({status: "error", error: "Failed to add answer."});
            }
        });
    });

    app.get('/questions/:id/answers', function(req, res) {
        var id = req.params.id;

        var answersQuery = { questionId: id };

        var searchSuccess = false;
        var answers = [];

        var db = mongoUtil.getDB();

        db.collection(COLLECTION_ANSWERS).find(answersQuery)
        .forEach(function(answerDoc) {
            var answerUserQuery = { userId: answerDoc.userId };

            db.collection(COLLECTION_USERS).findOne(answerUserQuery)
            .then(function(userDoc) {
                if (userDoc == null) {
                    console.log("Could not find user with userId: " + answerDoc.userId + " for answer with id: " + answerDoc.answerId);
                    return;
                }
                var answer = {
                                id: answerDoc.answerId, user: userDoc.username, body: answerDoc.body, score: answerDoc.score,
                                is_accepted: answerDoc.accepted, timestamp: answerDoc.timestamp, media: answerDoc.media
                            };
                answers.push(answer);
            })
            .catch(function(error) {
                console.log("Could not get user who posted the answer with id: " + answerDoc.answerId + ". Error: " + error);
            })
        })
        .then(function(ret) {
            console.log("Not sure what goes here. Might be nothing: " + ret);
            searchSuccess = true;
        })
        .catch(function(error) {
            console.log("Failed somewhere in the process of getting all answers to questionId: " + id + ". Error: " + error);
            searchSuccess = false;
        })
        .finally(function() {
            if (searchSuccess) {
                res.json({status: "OK", answers: answers});
            }
            else {
                res.json({status: "error", questions: null, error: "Failed to get answers for question with ID: " + id});
            }
        });

    });

};