
var loggerUtils = require('./LoggerUtils.js');
var logger = loggerUtils.getWriteLogger();

var mongoUtil = require('./MongoUtils.js');
// var cassandraUtils = require('./CassandraUtils.js');
var elasticUtils = require('./ElasticUtils.js');
var rabbitUtils = require('./RabbitmqUtils.js');
const util = require('util');

let constants = require('./Utils.js');


var cassandraUtils = require('./CassandraUtils.js');
var cassandraFullName = cassandraUtils.cassandraFullName;

const COLLECTION_USERS = constants.COLLECTION_USERS;
const COLLECTION_COOKIES = constants.COLLECTION_COOKIES;
const COLLECTION_QUESTIONS = constants.COLLECTION_QUESTIONS;
const COLLECTION_ANSWERS = constants.COLLECTION_ANSWERS;
const COLLECTION_QMEDIA = constants.COLLECTION_QMEDIA;
const COLLECTION_AMEDIA = constants.COLLECTION_AMEDIA;
const COLLECTION_MEDIA = constants.COLLECTION_MEDIA;
const COLLECTION_MEDIA_USER = constants.COLLECTION_MEDIA_USER;

var RABBITMQ_ADD_QUESTIONS = rabbitUtils.RABBITMQ_ADD_QUESTIONS;
var RABBITMQ_ADD_ANSWERS = rabbitUtils.RABBITMQ_ADD_ANSWERS;
var RABBITMQ_ADD_MEDIA = rabbitUtils.RABBITMQ_ADD_MEDIA;
var RABBITMQ_ADD_USERS = rabbitUtils.RABBITMQ_ADD_USERS;

var QUESTIONS_QUEUE = rabbitUtils.QUESTIONS_QUEUE;
var ANSWERS_QUEUE = rabbitUtils.ANSWERS_QUEUE;
var MEDIA_QUEUE = rabbitUtils.MEDIA_QUEUE;
var USERS_QUEUE = rabbitUtils.USERS_QUEUE;
var ES_QUEUE = rabbitUtils.ES_QUEUE;


var ES_PREFETCH = 1000
var QUESTIONS_PREFETCH = 500;
var ANSWERS_PREFETCH = 500;
var MEDIA_PREFETCH = 100;
var USERS_PREFETCH = 300;

// var ES_PREFETCH = 0
// var QUESTIONS_PREFETCH = 750;
// var ANSWERS_PREFETCH = 750;
// var MEDIA_PREFETCH = 100;
// var USERS_PREFETCH = 500;

var inserts = [];

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

async function batchSend() {
    if (ES_PREFETCH  > 0) {
        await sleep(10000);
        
        while (true) {
            await sleep(1500);
            if (inserts.length > 0) {
                var elasticClient = elasticUtils.getElasticClient();
                
                let temp = inserts;
                inserts = [];

                logger.debug("Attempting to insert " + temp.length + " documents into elastic search.");

                elasticClient.bulk({
                    body: temp
                })
                .then(function(ret) {
                    logger.debug("Return value of elastic search batch insert: " + ret);
                    logger.debug("Return of batch insert: " + util.inspect(ret, {showHidden: false, depth: 7}) + "\n\n");
                })
                .catch(function(error) {
                    logger.debug("Failed to do elastic search batch insert. Error: " + error);
                });
            }
        }
    }
}

async function startConsumer() {
    try {
        var db = await mongoUtil.getDbAsync();
        var connection = await rabbitUtils.getConnectionAsync();
        if (ES_PREFETCH > 0) {
            addES(db, connection);
        }
        addQuestions(db, connection);
        addAnswers(db, connection);
        addMedia(db, connection);
        addUsers(db, connection);

        logger.debug("Waiting for messages.");
    }
    catch (err) {
        logger.debug("Error starting consumer.");
    }
}

async function addES(db, connection) {
    var ch = await connection.createChannel();

    var ok = await ch.assertQueue(ES_QUEUE, {durable: true});
    await ch.prefetch(ES_PREFETCH);
    ch.consume(ES_QUEUE, function(msg) {
        var obj = JSON.parse(msg.content);

        let title = obj.title;
        let body = obj.body;
        let questionId = obj.questionId;
        let tags = obj.tags;

        let tagString = "";
        if (tags != null) {
            tagString = tags.join(" ");
        }

        inserts.push({ index: { _index: 'questions', _type: '_doc' } });
        inserts.push({ title: title, body: body, id: questionId, tags: tagString });

        ch.ack(msg);
    }, {noAck: false});
}

async function addQuestions(db, connection) {
    var ch = await connection.createChannel();

    var ok = await ch.assertQueue(QUESTIONS_QUEUE, {durable: true});
    await ch.prefetch(QUESTIONS_PREFETCH);
    ch.consume(QUESTIONS_QUEUE, function(msg) {
        var obj = JSON.parse(msg.content);

        let title = obj.title;
        let body = obj.body;
        let questionId = obj.questionId;
        let tags = obj.tags;
        let userId = obj.userId;
        let timestamp = obj.timestamp;
        let media = obj.media;
        let username = obj.username;
    
        // media inserts
        var qMediaDocs = [];
        if (media != null) {
            media.forEach(function(mediaId) {
                qMediaDocs.push({_id: questionId, mediaId: mediaId}); 
            });
        }

        if (qMediaDocs.length > 0) {
            db.collection(COLLECTION_MEDIA).insertMany(qMediaDocs, {ordered: false})
            // db.collection(COLLECTION_MEDIA).updateMany({_id: {$in: qMediaDocs} }, { $set: {qaId: questionId} })
            .then(function(ret) {
                logger.debug("Insert many Q media IDs: " + ret);
            })
            .catch(function(error) {
                logger.debug("Error inserting Q media IDs: " + error);
            });
        }

        var has_media = (media != null);
        var insertQuestionQuery = {
                                    questionId: questionId, userId: userId, title: title, body: body, score: 0,
                                    view_count: 0, answer_count: 0, timestamp: timestamp, tags: tags, media: media,
                                    has_media: has_media, accepted_answer_id: null, accepted: false, username: username
                                };
        db.collection(COLLECTION_QUESTIONS).insertOne(insertQuestionQuery)
        .then(function(ret) {
            if (ret == null) {
                logger.debug("Add question returned null value.");
                return;
            }
            logger.debug("Add question result: " + ret);
        })
        .catch(function(error) {
            logger.debug("Unable to add question. Error: " + error);
        })
        .finally(function() {
            ch.ack(msg);
        });
    }, {noAck: false});
}

async function addAnswers(db, connection) {
    var ch = await connection.createChannel();
    
    var ok = await ch.assertQueue(ANSWERS_QUEUE, {durable: true});
    await ch.prefetch(ANSWERS_PREFETCH);
    ch.consume(ANSWERS_QUEUE, function(msg) {
        var obj = JSON.parse(msg.content);

        let answerId = obj.answerId;
        let questionId = obj.questionId;
        let body = obj.body;
        let media = obj.media;
        let userId = obj.userId;
        let timestamp = obj.timestamp;
        let username = obj.username;

        var aMediaDocs = [];
        if (media != null) {
            media.forEach(function(mediaId) {
                aMediaDocs.push({_id: answerId, mediaId: mediaId}); 
            });
        }

        if (aMediaDocs.length > 0) {
            db.collection(COLLECTION_MEDIA).insertMany(aMediaDocs, {ordered: false})
            // db.collection(COLLECTION_MEDIA).updateMany({_id: {$in: aMediaDocs} }, { $set: {qaId: answerId} })
            .then(function(ret) {
                logger.debug("Insert many A media IDs: " + ret);
            })
            .catch(function(error) {
                logger.debug("Error inserting A media IDs: " + error);
            });
        }

        var answerQuery = {
            answerId:answerId, questionId: questionId, body: body, media: media, userId: userId, score: 0,
            accepted: false, timestamp: timestamp, username: username
        };
        
        let updateQuestionsQuery = {questionId: questionId};
        let incrementAnswerCountQuery = { $inc: { answer_count: 1 } };
        db.collection(COLLECTION_QUESTIONS).updateOne(updateQuestionsQuery, incrementAnswerCountQuery);

        db.collection(COLLECTION_ANSWERS).insertOne(answerQuery)
        .then(function(ret) {
            logger.debug("Add answer result: " + ret);
        })
        .catch(function(error) {
            logger.debug("Failed to add answer. Error: " + error);
        })
        .finally(function() {
            ch.ack(msg);
        });
    }, {noAck: false});
}

async function addMedia(db, connection) {
    var ch = await connection.createChannel();
    
    var ok = await ch.assertQueue(MEDIA_QUEUE, {durable: true});
    await ch.prefetch(MEDIA_PREFETCH);
    ch.consume(MEDIA_QUEUE, function(msg) {
        var obj = JSON.parse(msg.content);

        var cassandraClient = cassandraUtils.getCassandraClient();
        var query = "INSERT INTO " + cassandraFullName + " (id, filename, contents) VALUES (?, ?, ?)";

        var filename = obj.filename;

        // logic for blob: Buffer.concat(chunks):Buffer -> Put buffer in object -> Buffer.from(JSON.stringify(object)) -> RabbitMQ ->
        // Data from right before RabbitMQ transit shows up in msg.content -> obj = JSON.parse(msg.content) -> buffer is still in the content property
        // of the object but now it has the structure: {content: { type: 'Buffer', data: [ 49, 50, 51, 52, 49, 50, 51 ] }, ... } ->
        // Buffer.from(obj.content.data) -> Now we have the original buffer.
        var file = Buffer.from(obj.content.data);
        var id = obj.id;
        var userId = obj.userId;

        var mediaUserQuery = {_id: id, userId: userId};
        db.collection(COLLECTION_MEDIA_USER).insertOne(mediaUserQuery);

        logger.debug("Cassandra Insert");
        cassandraClient.execute(query, [id, filename, file], {prepare: true})
        .then(function(result) {
            logger.debug("Inserting file id: " + id + ", filename: " + filename + ", result: " + result);
        })
        .catch(function(error) {
            logger.debug("Error inserting into cassandra: " + error);
        })
        .finally(function() {
            ch.ack(msg);
        });
    }, {noAck: false});
}

async function addUsers(db, connection) {
    var ch = await connection.createChannel();
    
    var ok = await ch.assertQueue(USERS_QUEUE, {durable: true});
    await ch.prefetch(USERS_PREFETCH);
    ch.consume(USERS_QUEUE, function(msg) {
        var obj = JSON.parse(msg.content);

        var userId = obj.userId;
        var username = obj.username;
        var password = obj.password;
        var email = obj.email;
        var key = obj.key;

        var insertQuery = {
            userId: userId, username: username, password: password, email: email,
            reputation: 1, verified: false, key: key
        };

        db.collection(COLLECTION_USERS).insertOne(insertQuery)
        .then(function(result) {
            logger.debug("[MQ Add Users] - Adding userId: " + userId + ", email: " + email + ", result: " + result);
        })
        .catch(function(error) {
            logger.debug("[MQ Add Users] - Unable to add userId: " + userId + ", email: " + email + ", Error: " + error);
        })
        .finally(function() {
            ch.ack(msg);
        });
 
        sendMail(email, key);

    }, {noAck: false});
}

// async function deleteQuestions(db, connection) {

// }

startConsumer();
batchSend();




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
