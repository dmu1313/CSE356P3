
function generateKey() {
    var key = "", possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < 64; i++) {
        key += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return key;
}

function sendMail(email, key) {
    // send email
    const nodemailer = require('nodemailer');
    let transporter = nodemailer.createTransport({
        host: "localhost",
        port: 25,
        secure: false,
        tls: {
            rejectUnauthorized: false
        }
    });

    let mailOptions = {
        from: 'dmu@arrayoutofbounds.com',
        to: email,
        subject: 'Verification Key',
        text: "validation key: <" + key + ">",
        html: "validation key: <" + key + ">"
    }

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
    });
}

module.exports = function(app) {

    let constants = require('./Utils.js');
    const STATUS_OK = constants.STATUS_OK;
    const STATUS_ERROR = constants.STATUS_ERROR;
    
    const COLLECTION_USERS = constants.COLLECTION_USERS;
    const COLLECTION_COOKIES = constants.COLLECTION_COOKIES;
    const COLLECTION_QUESTIONS = constants.COLLECTION_QUESTIONS;
    const COLLECTION_ANSWERS = constants.COLLECTOIN_ANSWERS;
    
    var getRandomIdString = constants.getRandomIdString;

    let mongoUtil = require('./MongoUtils');

    app.post('/adduser/', async function (req, res) {
        console.log("Add User");

        let username = req.body.username;
        let password = req.body.password;
        let email = req.body.email;
        let key = username + "-" + generateKey();
        var db = mongoUtil.getDB();

        var userId;
        
        var userExistsQuery = { username: username, email: email };
        var userExists = false;
        
        var userIdExistsQuery = { userId: "" };
        var userIdExists = true;
        while (userIdExists) {
            userId = getRandomIdString();
            userIdExistsQuery = { userId: userId };
            userIdExists = await db.collection(COLLECTION_USERS).findOne(userIdExistsQuery)
            .then(function(doc) {
                if (doc == null) return false;
                else {
                    console.log("userId: " + userId + " already exists. Must get a new random userId.");
                    return true;
                }
            })
            .catch(function(error) {
                console.log("Failed to find if userId " + userId + " already exists.");
                return true;
            });
        }

        var insertQuery = { userId: userId, username: username, password: password, email: email, reputation: 0, verified: false, key: key };

        var insertSuccess = false;
        db.collection(COLLECTION_USERS).findOne(userExistsQuery)
        .then(function(doc) {
            if (doc != null) {
                userExists = true;
                return null;
            }
            else {
                return db.collection(COLLECTION_USERS).insertOne(insertQuery);
            }
        })
        .then(function(result) {
            if (result == null) {
                insertSuccess = false;
            }
            else {
                console.log("Inserting new user: " + username + ", " + result);
                insertSuccess = true;
            }
        })
        .catch(function(error) {
            console.log("Failed to insert new user due to error: " + error);
            insertSuccess = false;
        })
        .finally(function() {
            if (insertSuccess) {
                sendMail(email, key);
                res.json(STATUS_OK);
            }
            else {
                res.json({status: "error", error: "User already exists. You need a unique username and email."});
            }
        });
    });

    app.post('/verify', function(req, res) {
        var email = req.body.email;
        var key = req.body.key;
        var backdoor = "abracadabra";

        var db = mongoUtil.getDB();

        var verifySuccess = false;

        var verifyQuery;
        if (key === backdoor) {
            verifyQuery = { email: email };
        }
        else {
            verifyQuery = { email: email, key: key };
        }

        var update = {$set: {verified: true}};

        db.collection(COLLECTION_USERS).findOne(verifyQuery)
        .then(function(doc) {
            if (doc == null) {
                verifySuccess = false;
                return null;
            }
            return db.collection(COLLECTION_USERS).updateOne(verifyQuery, update);
        })
        .then(function(ret) {
            if (ret == null) return;
            console.log("Update verified result: " + ret);
            verifySuccess = true;
        })
        .catch(function(error) {
            console.log("Failed finding account to verify or updating account verified status: " + error);
            verifySuccess = false;
        })
        .finally(function() {
            if (verifySuccess) {
                res.json(STATUS_OK);
            }
            else {
                res.json({status: "error", error: "Could not verify account."});
            }
        });        
    });

};

