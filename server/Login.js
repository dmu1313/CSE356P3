
const util = require('util');

var mongoUtil = require('./MongoUtils.js');

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

        const errorMessage = "You are already logged in. You can't log in again.";

        if (cookie != undefined) {
            var isLoggedIn = await mongoUtil.checkIfUserLoggedIn(cookie);
            if (isLoggedIn) {
                res.json({status: "error", error: errorMessage});
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
            console.log("Error checking to see if user/pass is correct: " + error);
            return false;
        });

        if (!loginSuccess) {
            res.json({status: "error", error: "The username and password combination was not valid."});
            return;
        }

        let newCookie = username + Date.now();
        var cookieInsertSuccess = true;

        let cookieQuery = { val: newCookie, username: username, userId: userId };
        
        db.collection(COLLECTION_COOKIES).insertOne(cookieQuery)
        .then(function(ret) {
            console.log("New Cookie added: " + newCookie + "\nMongoDB Message: " + ret);
        })
        .catch(function(error) {
            console.log("Error Inserting Cookie: " + error);
            cookieInsertSuccess = false;
        })
        .finally(function() {
            if (cookieInsertSuccess) {
                // res.cookie('SessionID', newCookie, {expire: 600000 + Date.now(), signed: true});
                res.cookie('SessionID', newCookie);
                res.json(STATUS_OK);
            }
            else {
                res.json({status: "error", error: "Failed to insert cookie."});
            }
        });
    });

    app.post('/logout', async function(req, res) {
        var cookie = req.cookies['SessionID'];
        const errorMessage = "You are not logged in. You can't log out.";

        if (cookie == undefined) {
            res.json({ status: "error", error: errorMessage });
            return;
        }

        var isLoggedIn = await mongoUtil.checkIfUserLoggedIn(cookie);
        if (!isLoggedIn) {
            res.json({ status: "error", error: errorMessage });
        }
        else {
            let deleteQuery = { val: cookie }; 
            mongoUtil.getDB().collection(COLLECTION_COOKIES).deleteOne(deleteQuery)
            .then(function(ret) {
                console.log("Deleted: " + ret);
            })
            .catch(function(error) {
                console.log("Delete cookie error: " + error);
                res.json({ status: "error", error: "Failed to delete cookie." });
            })
            .finally(function() {
                res.clearCookie('SessionID');
                res.json(STATUS_OK);
            });
        }
    });

}