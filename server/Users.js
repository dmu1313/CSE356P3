
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

            console.log("Get user profile for username: " + username);
            if (userDoc != null) {
                console.log("Succeeded in getting user profile.")
                console.log("----------------------------------------");
                res.json({status: "OK",
                        user: {
                            email: userDoc.email,
                            reputation: userDoc.reputation
                        }
                });
            }
            else {
                console.log("Failed to get user profile.");
                console.log("--------------------------------------");
                res.status(400).json({status: "error"});
            }

        }
        catch (error) {
            console.log("Failed to get user profile. Error: " + error);
            console.log("--------------------------------------");
            res.status(400).json({status: "error"});
        }
    });

    app.get('/user/:username/questions', async function(req, res) {
        var username = req.params.username;
        var db = mongoUtil.getDB();

        try {
            console.log("Getting question Ids for username: " + username);
            var searchQuery = {username: username};

            var questionIds = [];
            var cursor = await db.collection(COLLECTION_QUESTIONS).find(searchQuery);
            while (await cursor.hasNext()) {
                let questionDoc = await cursor.next();
                questionIds.push(questionDoc.questionId);
            }
            console.log(username + " has posted " + questionIds.length + " questions.");
            console.log("--------------------------------------------------------");
            res.json({status: "OK", questions: questionIds});
        }
        catch (error) {
            console.log("Error getting questions for username: " + username);
            console.log("-------------------------------------------");
            res.status(400).json({status: "error"});
        }
    });

    app.get('/user/:username/answers', async function(req, res) {
        var username = req.params.username;
        var db = mongoUtil.getDB();

        try {
            console.log("Getting answer Ids for username: " + username);
            var searchQuery = {username: username};

            var answerIds = [];
            var cursor = await db.collection(COLLECTION_ANSWERS).find(searchQuery);
            while (await cursor.hasNext()) {
                let answerDoc = await cursor.next();
                answerIds.push(answerDoc.answerId);
            }
            console.log(username + " has posted " + answerIds.length + " answers.");
            console.log("--------------------------------------------------------");
            res.json({status: "OK", answers: answerIds});
        }
        catch (error) {
            console.log("Error getting questions for username: " + username);
            console.log("-------------------------------------------");
            res.status(400).json({status: "error"});
        }
    });


};
