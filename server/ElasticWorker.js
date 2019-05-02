
var loggerUtils = require('./LoggerUtils.js');
var logger = loggerUtils.getElasticWriteLogger();

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
var ES_QUEUE = rabbitUtils.ES_QUEUE;


var inserts = [];


function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

async function batchSend() {
    await sleep(1500);

    elasticClient.index({
        index: 'questions',
        // refresh: true,
        body: {
            title: title,
            body: body,
            id: questionId,
            tags: tagString
        }
    })
    .then(function(ret) {
        logger.debug("Return value of inserting question " + questionId + " into ElasticSearch: " + ret);
    })
    .catch(function(error) {
        logger.debug("Failed to insert question " + questionId + " into ElasticSearch. Error: " + error);
    })
    .finally(function() {
        ch.ack(msg);
    });

}

async function startConsumer() {
    try {
        var db = await mongoUtil.getDbAsync();
        var connection = await rabbitUtils.getConnectionAsync();
        var ch = await connection.createChannel();

        var ok = await ch.assertQueue(ES_QUEUE, {durable: true});
        await ch.prefetch(250);
        ch.consume(ES_QUEUE, function(msg) {
            var obj = JSON.parse(msg.content);
            // console.log("obj.t: " + obj.t);
            var elasticClient = elasticUtils.getElasticClient();

            let title = obj.title;
            let body = obj.body;
            let questionId = obj.questionId;
            let tags = obj.tags;
            let userId = obj.userId;
            let timestamp = obj.timestamp;
            let media = obj.media;
            let username = obj.username;

            let tagString = "";
            if (tags != null) {
                tagString = tags.join(" ");
            }

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
                // ch.ack(msg);
                // if (doneInserting) {
                //     ch.ack(msg);
                // }
                // else {
                //     doneInserting = true;
                // }
            });
        }
    }
    catch (err) {
        logger.debug("Error starting consumer.");
    }
}

startConsumer();

/*
amqp.connect('amqp://localhost', function(err, conn) {
  conn.createChannel(function(err, ch) {
    var q = 'task_queue';

    ch.assertQueue(q, {durable: true});
    ch.prefetch(1);
    logger.debug(" [*] Waiting for messages in %s. To exit press CTRL+C", q);
    ch.consume(q, function(msg) {
    //   var secs = msg.content.toString().split('.').length - 1;
    var secs = 0;
    logger.debug("Message: " + msg.content);
    logger.debug("type: " + msg.content.type);
    logger.debug("userId: " + msg.content.userId);
    logger.debug("body: " + msg.content.body);
    logger.debug(util.inspect(msg, {showHidden: false, depth: null}));
    logger.debug(util.inspect(msg.content, {showHidden: false, depth: 4}));


    var json = JSON.parse(msg.content);
    logger.debug("type: " + json.type);
    logger.debug("userId: " + json.userId);
    logger.debug("body: " + json.body);
    

    //   logger.debug(" [x] Received %s", msg.content.toString());
      setTimeout(function() {
        logger.debug(" [x] Done");
        ch.ack(msg) ;
      }, secs * 1000);
    }, {noAck: false});
  });
});
*/