
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

var RABBITMQ_ADD_QUESTIONS = rabbitUtils.RABBITMQ_ADD_QUESTIONS;
var RABBITMQ_ADD_ANSWERS = rabbitUtils.RABBITMQ_ADD_ANSWERS;
var RABBITMQ_ADD_MEDIA = rabbitUtils.RABBITMQ_ADD_MEDIA;
var QUEUE_NAME = rabbitUtils.QUEUE_NAME;

async function startConsumer() {
    try {
        var db = await mongoUtil.getDbAsync();
        var connection = await rabbitUtils.getConnectionAsync();
        var ch = await connection.createChannel();

        var ok = await ch.assertQueue(QUEUE_NAME, {durable: true});
        await ch.prefetch(100);
        ch.consume(QUEUE_NAME, function(msg) {
            var obj = JSON.parse(msg.content);
            // console.log("obj.t: " + obj.t);
            var elasticClient = elasticUtils.getElasticClient();

            if (obj.t == RABBITMQ_ADD_QUESTIONS) {
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

                let doneInserting = false;

                elasticClient.index({
                    index: 'questions',
                    refresh: true,
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
                    // if (doneInserting) {
                        ch.ack(msg);
                    // }
                    // else {
                    //     doneInserting = true;
                    // }
                });

                // media inserts
                var qMediaDocs = [];
                if (media != null) {
                    media.forEach(function(mediaId) {
                        qMediaDocs.push({_id: questionId, mediaId: mediaId}); 
                    });
                }

                if (qMediaDocs.length > 0) {
                    db.collection(COLLECTION_MEDIA).insertMany(qMediaDocs, {ordered: false})
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
            else if (obj.t == RABBITMQ_ADD_ANSWERS) {
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
                
            }
            else if (obj.t == RABBITMQ_ADD_MEDIA) {
                var cassandraClient = cassandraUtils.getCassandraClient();
                var query = "INSERT INTO " + cassandraFullName + " (id, filename, contents) VALUES (?, ?, ?)";

                var filename = obj.filename;

                // logic for blob: Buffer.concat(chunks):Buffer -> Put buffer in object -> Buffer.from(JSON.stringify(object)) -> RabbitMQ ->
                // Data from right before RabbitMQ transit shows up in msg.content -> obj = JSON.parse(msg.content) -> buffer is still in the content property
                // of the object but now it has the structure: {content: { type: 'Buffer', data: [ 49, 50, 51, 52, 49, 50, 51 ] }, ... } ->
                // Buffer.from(obj.content.data) -> Now we have the original buffer.
                var file = Buffer.from(obj.content.data);
                var id = obj.id;
    
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
            }

        }, {noAck: false});

        logger.debug("Waiting for messages.");
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
