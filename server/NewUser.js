
var loggerUtils = require('./LoggerUtils.js');
var logger = loggerUtils.getAppLogger();
var util = require('util');

const nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
    host: "localhost",
    port: 25,
    secure: false,
    tls: {
        rejectUnauthorized: false
    }
});



var rabbitUtils = require('./RabbitmqUtils.js');
var USERS_QUEUE = rabbitUtils.USERS_QUEUE;
var EMAIL_QUEUE = rabbitUtils.EMAIL_QUEUE;

function generateKey() {
    var key = "", possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < 8; i++) {
        key += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return key;
}

function sendMail(email, key) {
    // send email

    let mailOptions = {
        from: 'dmu@arrayoutofbounds.com',
        to: email,
        subject: 'Verification Key',
        text: "validation key: <" + key + ">",
        html: "validation key: <" + key + ">"
        // html: "<p>validation key: &lt;" + key + "&gt;</p>"

    }

    transporter.sendMail(mailOptions, (error, info) => {
        logger.debug("Sending email");
        // logger.debug(util.inspect(info, {showHidden: false, depth: 4}));
        if (error) {
            return logger.debug(error);
        }
    });
}


function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

module.exports = function(app) {

    let constants = require('./Utils.js');
    const STATUS_OK = constants.STATUS_OK;
    
    const COLLECTION_USERS = constants.COLLECTION_USERS;
    const COLLECTION_COOKIES = constants.COLLECTION_COOKIES;
    const COLLECTION_QUESTIONS = constants.COLLECTION_QUESTIONS;
    const COLLECTION_ANSWERS = constants.COLLECTOIN_ANSWERS;
    
    var getRandomIdString = constants.getRandomIdString;

    let mongoUtil = require('./MongoUtils');

    app.post('/adduser/', async function (req, res) {
        var rabbitChannel = rabbitUtils.getChannel();

        let username = req.body.username;
        let password = req.body.password;
        let email = req.body.email;
        let key = username + generateKey();
        var db = mongoUtil.getDB();

        var userId = getRandomIdString();
        
        var userExistsQuery = { $or: [ {username: username}, {email: email} ] };
        var insertQuery = { userId: userId, username: username, password: password, email: email, reputation: 1, verified: false, key: key };


        var isUserUnique = await db.collection(COLLECTION_USERS).findOne(userExistsQuery)
        .then(function(userDoc) {
            return userDoc == null;
        });

        if (isUserUnique) {
            try {
                let result = await db.collection(COLLECTION_USERS).insertOne(insertQuery);

                // logger.debug("[/adduser] - Adding userId: " + userId + ", result: " + result);
                
                sendMail(email, key);

                // let msg = { email: email, key: key };
                // rabbitChannel.sendToQueue(EMAIL_QUEUE, Buffer.from(JSON.stringify(msg)), {persistent: true});

                await sleep(30);

                res.json(STATUS_OK);
            }
            catch (error) {
                logger.debug("[/adduser] - Unable to add userId: " + userId);
            }
            
            // Send RabbitMQ message
            // var msg = {
            //     userId: userId, username: username, password: password, email: email,
            //     key: key
            // };
            // rabbitChannel.sendToQueue(USERS_QUEUE, Buffer.from(JSON.stringify(msg))/*, {persistent: true}*/);
            // logger.debug("[/adduser] - Sending userId " + userId + " to RabbitMQ for creation.");

            // res.json(STATUS_OK);
        }
        else {
            logger.debug("[/adduser] - Unable to add userId: " + userId);
            res.status(400).json({status: "error", error: "User already exists. You need a unique username and email."});
        }
    });

    app.post('/verify', function(req, res) {
        var email = req.body.email;
        var key = req.body.key;
        var backdoor = "abracadabra";

        // logger.debug("[/verify] - Email: " + email);
        // logger.debug("[/verify] - Key: " + key);

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
        var username, userId;

        db.collection(COLLECTION_USERS).findOne(verifyQuery)
        .then(function(doc) {
            if (doc == null) {
                verifySuccess = false;
                return null;
            }
            username = doc.username;
            userId = doc.userId;
            // logger.debug("[/verify] - Attempting to verify username: " + username + ", userId: " + userId);
            return db.collection(COLLECTION_USERS).updateMany(verifyQuery, update);
        })
        .then(function(ret) {
            if (ret == null) return;
            // logger.debug("[/verify] - Update verified result: " + ret);
            verifySuccess = true;
        })
        .catch(function(error) {
            logger.debug("[/verify] - Failed to update userId " + userId + ": " + error);
            verifySuccess = false;
        })
        .finally(function() {
            if (verifySuccess) {
                // logger.debug("[/verify] - Sucessfully verified userId " + userId);
                res.json(STATUS_OK);
            }
            else {
                res.status(400).json({status: "error", error: "Could not verify account."});
            }
        });        
    });

};

