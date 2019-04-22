


var amqp = require('amqplib/callback_api');
const util = require('util');


amqp.connect('amqp://localhost')


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
