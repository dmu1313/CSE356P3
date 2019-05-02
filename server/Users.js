
var loggerUtils = require('./LoggerUtils.js');
var logger = loggerUtils.getAppLogger();

const util = require('util');

var mongoUtil = require('./MongoUtils.js');

let constants = require('./Utils.js');

const COLLECTION_USERS = constants.COLLECTION_USERS;
const COLLECTION_QUESTIONS = constants.COLLECTION_QUESTIONS;
const COLLECTION_ANSWERS = constants.COLLECTION_ANSWERS;


module.exports = function(app) {

    app.get('/user/:username', async function(req, res) {
        var username = req.params.username;
        var userQuery = { username: username };
        var db = mongoUtil.getDB();
        
        try {
            var userDoc = await db.collection(COLLECTION_USERS).findOne(userQuery);

            if (userDoc != null) {
                let userId = userDoc.userId;
                let email = userDoc.email;
                let reputation = userDoc.reputation;
                logger.debug("[/user/:username] - Successfully got user profile username: " + username + ", userId: " + userId + ", email: " + email + ", reputation: " + reputation);
                res.json({status: "OK",
                        user: {
                            email: userDoc.email,
                            reputation: userDoc.reputation
                        }
                });
            }
            else {
                logger.debug("[/user/:username] - Failed to get user profile username: " + username + ", userId: " + userDoc.userId);
                res.status(400).json({status: "error"});
            }

        }
        catch (error) {
            logger.debug("[/user/:username] - Failed to get user profile username: " + username);
            res.status(400).json({status: "error"});
        }
    });

    app.get('/user/:username/questions', async function(req, res) {
        var username = req.params.username;
        var db = mongoUtil.getDB();

        try {
            var searchQuery = {username: username};

            var questionIds = [];
            var cursor = await db.collection(COLLECTION_QUESTIONS).find(searchQuery);
            while (await cursor.hasNext()) {
                let questionDoc = await cursor.next();
                questionIds.push(questionDoc.questionId);
            }
            logger.debug("[/user/:username/questions] - Got " + questionIds.length + " questions for username: " + username);
            res.json({status: "OK", questions: questionIds});
        }
        catch (error) {
            logger.debug("[/user/:username/questions] - Failed to get questions for username: " + username + ", Error: " + error);
            res.status(400).json({status: "error"});
        }
    });

    app.get('/user/:username/answers', async function(req, res) {
        var username = req.params.username;
        var db = mongoUtil.getDB();

        try {
            var searchQuery = {username: username};

            var answerIds = [];
            var cursor = await db.collection(COLLECTION_ANSWERS).find(searchQuery);
            while (await cursor.hasNext()) {
                let answerDoc = await cursor.next();
                answerIds.push(answerDoc.answerId);
            }
            logger.debug("[/user/:username/answers] - Got + " + answerIds.length + " answers for username: " + username);
            res.json({status: "OK", answers: answerIds});
        }
        catch (error) {
            logger.debug("[/user/:username/answers] - Failed to get answers for username: " + username + ", Error: " + error);
            res.status(400).json({status: "error"});
        }
    });
};
