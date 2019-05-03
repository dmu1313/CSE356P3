
var loggerUtils = require('./LoggerUtils.js');
var logger = loggerUtils.getAppLogger();

var amqp = require('amqplib');
// var url = 'amqp://localhost';
var url = 'amqp://192.168.122.29';

var _connection;
var _ch;

module.exports = {
    connect: async function() {
        try {
            var conn = await amqp.connect(url);
            _connection = conn;
            _ch = await conn.createChannel();
            logger.debug("CONNECTED to RabbitMQ");
        }
        catch (error) {
            logger.debug("Error connecting to RabbitMQ: " + error);
        }
    },
    getConnection: function() {
        return _connection;
    },
    getChannel: function() {
        return _ch;
    },
    getConnectionAsync: function() {
        if (_connection == null) {
            return amqp.connect(url)
            .then(function(conn) {
                logger.debug("Connected to RabbitMQ Async");
                _connection = conn;
                return conn;
            })
            .catch(function(error) {
                logger.debug("Error connecting to RabbitMQ Async: " + error);
            });
        }
        else {
            return new Promise(function(resolve, reject) {
                resolve(_connection);
            });
        }
    },
    RABBITMQ_ADD_QUESTIONS: "/questions/add",
    RABBITMQ_ADD_ANSWERS: "/answers/add",
    RABBITMQ_ADD_MEDIA: "/addmedia",
    RABBITMQ_ADD_USERS: "/adduser",
    
    QUESTIONS_QUEUE: "questions_queue",
    ANSWERS_QUEUE: "answers_queue",
    MEDIA_QUEUE: "media_queue",
    USERS_QUEUE: "users_queue",
    ES_QUEUE: "es_queue"

};
