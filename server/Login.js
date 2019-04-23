
var loggerUtils = require('./LoggerUtils.js');
var logger = loggerUtils.getAppLogger();

const util = require('util');

var mongoUtil = require('./MongoUtils.js');

var memcachedUtils = require('./MemcachedUtils.js');

let constants = require('./Utils.js');
const STATUS_OK = constants.STATUS_OK;

const COLLECTION_USERS = constants.COLLECTION_USERS;
const COLLECTION_COOKIES = constants.COLLECTION_COOKIES;
const COLLECTION_QUESTIONS = constants.COLLECTION_QUESTIONS;
const COLLECTION_ANSWERS = constants.COLLECTOIN_ANSWERS;

module.exports = function(app) {

    app.post('/login', async function(req, res) {
        var cookie = req.cookies['SessionID'];
        var username = req.body.username;
        var password = req.body.password;
        var db = mongoUtil.getDB();
        var memcached = memcachedUtils.memcached;

        const errorMessage = "You are already logged in. You can't log in again.";

        if (cookie != undefined) {
            var isLoggedIn = await mongoUtil.checkIfUserLoggedIn(cookie);
            if (isLoggedIn) {
                res.status(400).json({status: "error", error: errorMessage});
                return;
            }
        }

        var userId;

        let loginQuery = {username: username, password: password, verified: true};
        var loginSuccess = await db.collection(COLLECTION_USERS).findOne(loginQuery)
        .then(function(doc) {
            if (doc != null) {
                userId = doc.userId;
            }
            return doc != null;
        })
        .catch(function(error) {
            logger.debug("Error checking to see if user/pass is correct: " + error);
            return false;
        });

        if (!loginSuccess) {
            res.status(401).json({status: "error", error: "The username and password combination was not valid."});
            return;
        }

        let newCookie = username + Date.now();
        var cookieInsertSuccess = true;

        let cookieQuery = { val: newCookie, username: username, userId: userId };

        // Insert cookie into memcached
        let memCookieObj = {userId: userId, username: username};
        memcached.set(newCookie, memCookieObj, 86400, function(err) {
            if (err) {
                logger.debug("Login: Error setting object in memcached: " + err);
            }
        });

        db.collection(COLLECTION_COOKIES).insertOne(cookieQuery)
        .then(function(ret) {
            logger.debug("New Cookie added: " + newCookie + "\nMongoDB Message: " + ret);
        })
        .catch(function(error) {
            logger.debug("Error Inserting Cookie: " + error);
            cookieInsertSuccess = false;
        })
        .finally(function() {
            if (cookieInsertSuccess) {
                // res.cookie('SessionID', newCookie, {expire: 600000 + Date.now(), signed: true});
                res.cookie('SessionID', newCookie);
                res.json(STATUS_OK);
            }
            else {
                res.status(401).json({status: "error", error: "Failed to insert cookie."});
            }
        });
    });

    app.post('/logout', async function(req, res) {
        var cookie = req.cookies['SessionID'];
        const errorMessage = "You are not logged in. You can't log out.";
        var memcached = memcachedUtils.memcached;

        if (cookie == undefined) {
            res.status(400).json({ status: "error", error: errorMessage });
            return;
        }

        var isLoggedIn = await mongoUtil.checkIfUserLoggedIn(cookie);
        if (!isLoggedIn) {
            res.status(400).json({ status: "error", error: errorMessage });
        }
        else {
            let deleteQuery = { val: cookie }; 

            // Delete cookie from memcached.
            memcached.del(cookie, function(err) {
                logger.debug("Error deleting cookie " + cookie + " from memcached: " + err);
            });

            mongoUtil.getDB().collection(COLLECTION_COOKIES).deleteOne(deleteQuery)
            .then(function(ret) {
                logger.debug("Deleted: " + ret);
            })
            .catch(function(error) {
                logger.debug("Delete cookie error: " + error);
                res.status(400).json({ status: "error", error: "Failed to delete cookie." });
            })
            .finally(function() {
                res.clearCookie('SessionID');
                res.json(STATUS_OK);
            });
        }
    });

}