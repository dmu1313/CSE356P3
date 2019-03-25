
var mongoUtil = require('./MongoUtils.js');

let constants = require('./Utils.js');
const STATUS_OK = constants.STATUS_OK;

const COLLECTION_USERS = constants.COLLECTION_USERS;
const COLLECTION_COOKIES = constants.COLLECTION_COOKIES;
const COLLECTION_QUESTIONS = constants.COLLECTION_QUESTIONS;
const COLLECTION_ANSWERS = constants.COLLECTOIN_ANSWERS;
const COLLECTION_IP_VIEWS = constants.COLLECTION_IP_VIEWS;
const COLLECTION_USER_VIEWS = constants.COLLECTION_USER_VIEWS;

var getRandomIdString = constants.getRandomIdString;
var getUnixTime = constants.getUnixTime;

module.exports = function(app) {

    app.get('/questions/:id', async function(req, res) {
        var id = req.params.id;
        var ip = req.ip;
        var db = mongoUtil.getDB();

        
        var cookie = req.cookies['SessionID'];
        var username;
        if (cookie != undefined) {
            username = await mongoUtil.getUserForCookie(cookie);
        }

        if (username == null) {
            // If not logged in, check to increment view_count for ip.
        }
        else {
            // If logged in, check to increment view_count for user.
            var userViewQuery = { userId: }
            db.collection(COLLECTION_USER_VIEWS).find();
        }

        if(isLoggedIn) {
            // If logged in, check to increment view_count for user.
            db.collection(COLLECTION_USER_VIEWS).find();
        }
        else {
            // If not logged in, check to increment view_count for ip.
        }
        
        



        var searchQuery = { questionId: id };

        var questionDoc;
        var question;
        var searchSuccess = false;
        db.collection(COLLECTION_QUESTIONS).findOne(searchQuery)
        .then(function(doc) {
            if (doc == null) {
                console.log("No question with id: " + id);
                return null;
            }
            questionDoc = doc;
            var userPosterQuery = { userId: doc.userId };
            return db.collection(COLLECTION_USERS).findOne(userPosterQuery)
        })
        .then(function(userDoc) {
            if (userDoc == null) {
                console.log("Either the question with id: " + id + " does not exist or the user who posted it could not be found.");
                searchSuccess = false;
                return;
            }
            searchSuccess = true;
            question = {
                id: questionDoc.questionId, user: { username: userDoc.username, reputation: userDoc.reputation },
                title: questionDoc.title, body: questionDoc.body, score: questionDoc.score, view_count: questionDoc.view_count,
                answer_count: questionDoc.answer_count, timestamp: questionDoc.timestamp, media: questionDoc.media,
                tags: questionDoc.tags, accepted_answer_id: questionDoc.accepted_answer_id
            };

        })
        .catch(function(error) {
            console.log("Failed somewhere in the process of getting question " + id + ". Error: " + error);
            searchSuccess = false;
        })
        .finally(function() {
            if (searchSuccess) {
                res.json({status: "OK", question: question});
            }
            else {
                res.json({status: "error", questions: null, error: "Failed to get question with ID: " + id});
            }
        });
    });

    app.post('/questions/add', async function(req, res) {
        try {
            var title = req.body.title;
            var body = req.body.body;
            var tags = req.body.tags; // Array of tags (strings)
            var media = req.body.media;

            var cookie = req.cookies['SessionID'];
            const authErrorMessage = "User is not logged in. Must be logged in to add a question.";

            var userId = await mongoUtils.getIdForCookie(cookie);
            if (userId == null) {
                // Not logged in. Fail.
                console.log(authErrorMessage);
                res.json({status: "error", error: authErrorMessage});
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
                    res.json({status: "OK", id: questionId});
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

    app.post('/questions/:id/answers/add', function(req, res) {
        var id = req.params.id;

    });

    app.get('/questions/:id/answers', function(req, res) {
        var id = req.params.id;

        var answersQuery = { questionId: id };

        var searchSuccess = false;
        var answers = [];

        db.collection(COLLECTION_ANSWER).find(answersQuery)
        .then(function(docs) {
            if (docs == null) {
                console.log("Answers query returned a null cursor.";
                return null;
            }
            return docs.forEach(function(answerDoc) {
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
            });
        })
        .then(function(ret) {
            if (ret == null) {
                console.log("Search query for all answers to questionId: " + id + " failed.");
                searchSuccess = false;
            }
            else {
                console.log("Found all answers to questionId: " + id + ", " + ret);
                searchSuccess = true;
            }
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