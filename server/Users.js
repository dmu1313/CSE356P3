
var loggerUtils = require('./LoggerUtils.js');
var logger = loggerUtils.getAppLogger();

const util = require('util');

var mongoUtil = require('./MongoUtils.js');

let constants = require('./Utils.js');
const STATUS_OK = constants.STATUS_OK;

const COLLECTION_USERS = constants.COLLECTION_USERS;
const COLLECTION_COOKIES = constants.COLLECTION_COOKIES;
const COLLECTION_QUESTIONS = constants.COLLECTION_QUESTIONS;
const COLLECTION_ANSWERS = constants.COLLECTION_ANSWERS;
const COLLECTION_IP_VIEWS = constants.COLLECTION_IP_VIEWS;
const COLLECTION_USER_VIEWS = constants.COLLECTION_USER_VIEWS;


module.exports = function(app) {

    app.get('/user/:username', async function(req, res) {
        try {
            var username = req.params.username;
            var userQuery = { username: username };
            var db = mongoUtil.getDB();

            var userDoc = await db.collection(COLLECTION_USERS).findOne(userQuery);

            logger.debug("Get user profile for username: " + username);
            if (userDoc != null) {
                logger.debug("Succeeded in getting user profile.")
                logger.debug("----------------------------------------");
                res.json({status: "OK",
                        user: {
                            email: userDoc.email,
                            reputation: userDoc.reputation
                        }
                });
            }
            else {
                logger.debug("Failed to get user profile.");
                logger.debug("--------------------------------------");
                res.status(400).json({status: "error"});
            }

        }
        catch (error) {
            logger.debug("Failed to get user profile. Error: " + error);
            logger.debug("--------------------------------------");
            res.status(400).json({status: "error"});
        }
    });

    app.get('/user/:username/questions', async function(req, res) {
        var username = req.params.username;
        var db = mongoUtil.getDB();

        try {
            logger.debug("Getting question Ids for username: " + username);
            var searchQuery = {username: username};

            var questionIds = [];
            var cursor = await db.collection(COLLECTION_QUESTIONS).find(searchQuery);
            while (await cursor.hasNext()) {
                let questionDoc = await cursor.next();
                questionIds.push(questionDoc.questionId);
            }
            logger.debug(username + " has posted " + questionIds.length + " questions.");
            logger.debug("--------------------------------------------------------");
            res.json({status: "OK", questions: questionIds});
        }
        catch (error) {
            logger.debug("Error getting questions for username: " + username);
            logger.debug("-------------------------------------------");
            res.status(400).json({status: "error"});
        }
    });

    app.get('/user/:username/answers', async function(req, res) {
        var username = req.params.username;
        var db = mongoUtil.getDB();

        try {
            logger.debug("Getting answer Ids for username: " + username);
            var searchQuery = {username: username};

            var answerIds = [];
            var cursor = await db.collection(COLLECTION_ANSWERS).find(searchQuery);
            while (await cursor.hasNext()) {
                let answerDoc = await cursor.next();
                answerIds.push(answerDoc.answerId);
            }
            logger.debug(username + " has posted " + answerIds.length + " answers.");
            logger.debug("--------------------------------------------------------");
            res.json({status: "OK", answers: answerIds});
        }
        catch (error) {
            logger.debug("Error getting questions for username: " + username);
            logger.debug("-------------------------------------------");
            res.status(400).json({status: "error"});
        }
    });


};
