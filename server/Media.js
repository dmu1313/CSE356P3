
var loggerUtils = require('./LoggerUtils.js');
var logger = loggerUtils.getAppLogger();

var rabbitUtils = require('./RabbitmqUtils.js');

var RABBITMQ_ADD_MEDIA = rabbitUtils.RABBITMQ_ADD_MEDIA;
var QUEUE_NAME = rabbitUtils.QUEUE_NAME;

const formidable = require('formidable');
var cassandraUtils = require('./CassandraUtils.js');
var mongoUtil = require('./MongoUtils.js');


var cassandraKeyspace = cassandraUtils.cassandraKeyspace;
var cassandraTable = cassandraUtils.cassandraTable;
var cassandraFullName = cassandraUtils.cassandraFullName;

let constants = require('./Utils.js');
var getRandomIdString = constants.getRandomIdString;
const COLLECTION_MEDIA_USER = constants.COLLECTION_MEDIA_USER;


module.exports = function(app) {

    app.post('/addmedia', async function(req, res) {
        logger.debug("/addmedia");
        var id = getRandomIdString();

        var form = new formidable.IncomingForm();
        var chunks = [];
        
        var filename;

        form.onPart = function(part) {
            // console.log(part.filename);
            if (!part.filename) {
                form.handlePart(part);
                return;
            }
            else {
                filename = part.filename;
            }
            part.on('data', function(data) {
                chunks.push(data);
            });
            part.on('end', function() {
                // res.send(Buffer.concat(chunks));
            });
            part.on('error', function(err) {
                // handle this too
                logger.debug("error handling stream: " + err);
            });
        }

        var cookie = req.cookies['SessionID'];
        const authErrorMessage = "Must be logged in to add media.";

        var user = await mongoUtil.getUserAndIdForCookie(cookie);
            
        if (user == null) {
            // Not logged in. Fail.
            logger.debug(authErrorMessage);
            res.status(401).json({status: "error", error: authErrorMessage});
            return;
        }

        form.parse(req, async function(err, fields, files) {
            // logger.debug("fields: " + util.inspect(fields, {showHidden: false, depth: null}));
            // logger.debug("files: " + util.inspect(files, {showHidden: false, depth: null}));

            logger.debug("addmedia: user: " + user.userId);

            var file = Buffer.concat(chunks);
            // var filename = fields.filename;

            var rabbitChannel = rabbitUtils.getChannel();

            // console.log("Sending /addmedia to RabbitMQ");
            // console.log("Filename: " + filename);
            var msg = {t: RABBITMQ_ADD_MEDIA, content: file, filename: filename, id: id, userId: user.userId};

            rabbitChannel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(msg))/*, {persistent: true}*/);
    

            // cassandraClient.execute(query, [id, filename, file], {prepare: true})
            // .then(function(result) {
            //     logger.debug("Inserting file id: " + id + ", filename: " + filename + ", result: " + result);
            // })
            // .catch(function(error) {
            //     logger.debug("Error inserting: " + error);
            // });

            res.json({status: "OK", id: id});
            

        });

    });

    app.get('/media/:id', async function(req, res) {
        var id = req.params.id;
        logger.debug("GET /media/" + id);
        var cassandraClient = cassandraUtils.getCassandraClient();
        var db = mongoUtil.getDB();
        
        let mediaQuery = { mediaId: id };
        var mediaDoc = await db.collection(COLLECTION_MEDIA_USER).findOne(mediaQuery);

        if (mediaDoc == null) {
            logger.debug("THIS IS THE ERROR1");
            res.status(400).json({status: "error"});
            return;
        }

        var query = "SELECT id, filename, contents FROM " + cassandraFullName + " WHERE id = ?";
        cassandraClient.execute(query, [id], {prepare: true})
        .then(function(result) {
            if (result == null || result.first() == null) {
                logger.debug("No such media with id: " + id);
                logger.debug("THIS IS THE ERROR2");
                res.status(400).json({status: "error"});
                return;
            }
            var row = result.first();
            if (row['filename'] != null) {
                res.type(row['filename']);
            }
            res.status(200);
            res.send(row['contents']);
        })
        .catch(function(error) {
            logger.debug("THIS IS THE ERROR3");
            logger.debug("Error retrieving file with id: " + id + ", Error: " + error);
            res.status(400).json({status: "error"});
        });
    });

};