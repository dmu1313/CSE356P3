

var mongoUtil = require('./MongoUtils.js');
// var cassandraUtils = require('./CassandraUtils.js');
var elasticUtils = require('./ElasticUtils.js');
var rabbitUtils = require('./RabbitmqUtils.js');
const util = require('util');

let constants = require('./Utils.js');

const COLLECTION_USERS = constants.COLLECTION_USERS;
const COLLECTION_COOKIES = constants.COLLECTION_COOKIES;
const COLLECTION_QUESTIONS = constants.COLLECTION_QUESTIONS;
const COLLECTION_ANSWERS = constants.COLLECTION_ANSWERS;

var RABBITMQ_ADD_QUESTIONS = rabbitUtils.RABBITMQ_ADD_QUESTIONS;
var RABBITMQ_ADD_ANSWERS = rabbitUtils.RABBITMQ_ADD_ANSWERS;
var QUEUE_NAME = rabbitUtils.QUEUE_NAME;

async function startConsumer() {
    try {
        var db = await mongoUtil.getDbAsync();
        var connection = await rabbitUtils.getConnectionAsync();
        var ch = await connection.createChannel();

        var ok = await ch.assertQueue(QUEUE_NAME, {durable: true});
        await ch.prefetch(5);
        ch.consume(QUEUE_NAME, function(msg) {
            var obj = JSON.parse(msg.content);
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
                    console.log("Return value of inserting question " + questionId + " into ElasticSearch: " + ret);
                })
                .catch(function(error) {
                    console.log("Failed to insert question " + questionId + " into ElasticSearch. Error: " + error);
                })
                .finally(function() {
                    if (doneInserting) {
                        ch.ack(msg);
                    }
                    else {
                        doneInserting = true;
                    }
                });


                var has_media = (media != null);
                var insertQuestionQuery = {
                                            questionId: questionId, userId: userId, title: title, body: body, score: 0,
                                            view_count: 0, answer_count: 0, timestamp: timestamp, tags: tags, media: media,
                                            has_media: has_media, accepted_answer_id: null, accepted: false, username: username
                                        };
                db.collection(COLLECTION_QUESTIONS).insertOne(insertQuestionQuery)
                .then(function(ret) {
                    if (ret == null) {
                        console.log("Add question returned null value.");
                        return;
                    }
                    console.log("Add question result: " + ret);
                })
                .catch(function(error) {
                    console.log("Unable to add question. Error: " + error);
                })
                .finally(function() {
                    if (doneInserting) {
                        ch.ack(msg);
                    }
                    else {
                        doneInserting = true;
                    }
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

                var answerQuery = {
                    answerId:answerId, questionId: questionId, body: body, media: media, userId: userId, score: 0,
                    accepted: false, timestamp: timestamp, username: username
                };
                
                let updateQuestionsQuery = {questionId: questionId};
                let incrementAnswerCountQuery = { $inc: { answer_count: 1 } };
                db.collection(COLLECTION_QUESTIONS).updateOne(updateQuestionsQuery, incrementAnswerCountQuery);

                db.collection(COLLECTION_ANSWERS).insertOne(answerQuery)
                .then(function(ret) {
                    console.log("Add answer result: " + ret);
                })
                .catch(function(error) {
                    console.log("Failed to add answer. Error: " + error);
                })
                .finally(function() {
                    ch.ack(msg);
                });
                
            }

        }, {noAck: false});

        console.log("Waiting for messages.");
    }
    catch (err) {
        console.log("Error starting consumer.");
    }
}

startConsumer();

/*
amqp.connect('amqp://localhost', function(err, conn) {
  conn.createChannel(function(err, ch) {
    var q = 'task_queue';

    ch.assertQueue(q, {durable: true});
    ch.prefetch(1);
    console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q);
    ch.consume(q, function(msg) {
    //   var secs = msg.content.toString().split('.').length - 1;
    var secs = 0;
    console.log("Message: " + msg.content);
    console.log("type: " + msg.content.type);
    console.log("userId: " + msg.content.userId);
    console.log("body: " + msg.content.body);
    console.log(util.inspect(msg, {showHidden: false, depth: null}));
    console.log(util.inspect(msg.content, {showHidden: false, depth: 4}));


    var json = JSON.parse(msg.content);
    console.log("type: " + json.type);
    console.log("userId: " + json.userId);
    console.log("body: " + json.body);
    

    //   console.log(" [x] Received %s", msg.content.toString());
      setTimeout(function() {
        console.log(" [x] Done");
        ch.ack(msg) ;
      }, secs * 1000);
    }, {noAck: false});
  });
});
*/
