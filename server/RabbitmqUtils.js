
var amqp = require('amqplib');
// var url = 'amqp://localhost';
var url = 'amqp://192.168.122.29';
var QUEUE_NAME = 'final_queue';

var _connection;
var _ch;

module.exports = {
    connect: async function() {
        try {
            var conn = await amqp.connect(url);
            _connection = conn;
            _ch = await conn.createChannel();
            console.log("CONNECTED to RabbitMQ");
        }
        catch (error) {
            console.log("Error connecting to RabbitMQ: " + error);
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
                console.log("Connected to RabbitMQ Async");
                _connection = conn;
                return conn;
            })
            .catch(function(error) {
                console.log("Error connecting to RabbitMQ Async: " + error);
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
    QUEUE_NAME: QUEUE_NAME

};
