
var loggerUtils = require('./LoggerUtils.js');
var logger = loggerUtils.getAppLogger();
var util = require('util');

function generateKey() {
    var key = "", possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < 32; i++) {
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
        // html: "validation key: <" + key + ">"
        html: "<p>validation key: &lt;" + key + "&gt;</p>"

    }

    transporter.sendMail(mailOptions, (error, info) => {
        logger.debug("Sending email");
        logger.debug(util.inspect(info, {showHidden: false, depth: 4}));
        

        if (error) {
            return logger.debug(error);
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
        logger.debug("Add User");

        let username = req.body.username;
        let password = req.body.password;
        let email = req.body.email;
        let key = username + "-" + generateKey();
        var db = mongoUtil.getDB();

        var userId = getRandomIdString();
        
        var userExistsQuery = { username: username, email: email };
        var userExists = false;
        
        // var userIdExistsQuery = { userId: "" };
        // var userIdExists = true;
        // while (userIdExists) {
        //     userId = getRandomIdString();
        //     userIdExistsQuery = { userId: userId };
        //     userIdExists = await db.collection(COLLECTION_USERS).findOne(userIdExistsQuery)
        //     .then(function(doc) {
        //         if (doc == null) return false;
        //         else {
        //             logger.debug("userId: " + userId + " already exists. Must get a new random userId.");
        //             return true;
        //         }
        //     })
        //     .catch(function(error) {
        //         logger.debug("Failed to find if userId " + userId + " already exists.");
        //         return true;
        //     });
        // }


        var usernameExistsQuery = {username: username};
        var emailExistsQuery = {email: email};
        var userExistsQuery = { $or: [ { email: email },
                                    { username: username }
                                ]
                            };

        var insertQuery = { userId: userId, username: username, password: password, email: email, reputation: 1, verified: false, key: key };

        var isUserUnique = await db.collection(COLLECTION_USERS).findOne(userExistsQuery)
        .then(function(userDoc) {
            return userDoc == null;
        });
        // var isUsernameUnique = await db.collection(COLLECTION_USERS).findOne(usernameExistsQuery)
        //                                 .then(function(userDoc) {
        //                                     return userDoc == null;
        //                                 });
        // var isEmailUnique = await db.collection(COLLECTION_USERS).findOne(emailExistsQuery)
        //                                 .then(function(userDoc) {
        //                                     return userDoc == null;
        //                                 });

        if (isUserUnique) {
            let result = await db.collection(COLLECTION_USERS).insertOne(insertQuery);
            logger.debug("Add user result: " + result);
            sendMail(email, key);
            res.json(STATUS_OK);
        }
        else {
            res.status(400).json({status: "error", error: "User already exists. You need a unique username and email."});
        }

    });

    app.post('/verify', function(req, res) {
        logger.debug("//////////////////////////");
        logger.debug("/verify");
        var email = req.body.email;
        var key = req.body.key;
        var backdoor = "abracadabra";

        logger.debug("Email: " + email);
        logger.debug("Key: " + key);

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
            logger.debug("Update verified result: " + ret);
            verifySuccess = true;
        })
        .catch(function(error) {
            logger.debug("Failed finding account to verify or updating account verified status: " + error);
            verifySuccess = false;
        })
        .finally(function() {
            if (verifySuccess) {
                res.json(STATUS_OK);
            }
            else {
                res.status(400).json({status: "error", error: "Could not verify account."});
            }
        });        
    });

};

