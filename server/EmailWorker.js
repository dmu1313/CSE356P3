
var loggerUtils = require('./LoggerUtils.js');
var logger = loggerUtils.getWriteLogger();

var rabbitUtils = require('./RabbitmqUtils.js');
const util = require('util');

var ES_QUEUE = rabbitUtils.ES_QUEUE;
var EMAIL_QUEUE = rabbitUtils.EMAIL_QUEUE;

var EMAIL_PREFETCH = 20000;


const nodemailer = require('nodemailer');
let transporter = nodemailer.createTransport({
    host: "localhost",
    port: 25,
    secure: false,
    tls: {
        rejectUnauthorized: false
    }
});

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
        // logger.debug("Sending email");
        // logger.debug(util.inspect(info, {showHidden: false, depth: 4}));

        if (error) {
            return logger.debug(error);
        }
    });
}

async function startConsumer() {
    try {
        var connection = await rabbitUtils.getConnectionAsync();

        sendEmails(connection);

        logger.debug("Waiting for messages.");
    }
    catch (err) {
        logger.debug("Error starting consumer.");
    }
}

async function sendEmails(db, connection) {
    var ch = await connection.createChannel();
    var ok = await ch.assertQueue(EMAIL_QUEUE, {durable: true});
    await ch.prefetch(EMAIL_PREFETCH);
    ch.consume(ES_QUEUE, function(msg) {
        var obj = JSON.parse(msg.content);

        // obj will be as follows: { email:string, key:string}
        let email = obj.email;
        let key = obj.key;
        
        sendMail(email, key);

        ch.ack(msg);
    }, {noAck: false});
}

startConsumer();


