
const formidable = require('formidable');
var cassandraUtils = require('./CassandraUtils.js');
var mongoUtil = require('./MongoUtils.js');


var cassandraKeyspace = cassandraUtils.cassandraKeyspace;
var cassandraTable = cassandraUtils.cassandraTable;
var cassandraFullName = cassandraUtils.cassandraFullName;

let constants = require('./Utils.js');
var getRandomIdString = constants.getRandomIdString;

module.exports = function(app) {

    app.post('/addmedia', async function(req, res) {
        console.log("/addmedia");

        var cookie = req.cookies['SessionID'];
        const authErrorMessage = "Must be logged in to add media.";

        // Check to see if logged in first.
        var user = await mongoUtil.getUserAndIdForCookie(cookie);
        if (user == null) {
            // Not logged in. Fail.
            console.log(authErrorMessage);
            res.status(401).json({status: "error", error: authErrorMessage});
            return;
        }
        
        var cassandraClient = cassandraUtils.getCassandraClient();
        var query = "INSERT INTO " + cassandraFullName + " (id, filename, contents) VALUES (?, ?, ?)";

        var id = getRandomIdString();

        var form = new formidable.IncomingForm();
        var chunks = [];

        form.onPart = function(part) {
            if (!part.filename) {
                form.handlePart(part);
                return;
            }
            part.on('data', function(data) {
                chunks.push(data);
            });
            part.on('end', function() {
                // res.send(Buffer.concat(chunks));
            });
            part.on('error', function(err) {
                // handle this too
                console.log("error handling stream: " + err);
            });
        }

        form.parse(req, function(err, fields, files) {
            // console.log("fields: " + util.inspect(fields, {showHidden: false, depth: null}));
            // console.log("files: " + util.inspect(files, {showHidden: false, depth: null}));

            var file = Buffer.concat(chunks);
            var filename = fields.filename;

            cassandraClient.execute(query, [id, filename, file], {prepare: true})
            .then(function(result) {
                console.log("Inserting file id: " + id + ", filename: " + filename + ", result: " + result);
            })
            .catch(function(error) {
                console.log("Error inserting: " + error);
            });
        });

        res.json({status: "OK", id: id});
    });

    app.get('/media/:id', function(req, res) {
        var id = req.params.id;
        console.log("GET /media/" + id);
        
        var query = "SELECT id, filename, contents FROM imgs WHERE filename = ?";
        cassandraClient.execute(query, [id], {prepare: true})
        .then(function(result) {
            if (result == null || result.first() == null) {
                console.log("No such media with id: " + id);
                res.json({status: "OK"});
                return;
            }
            var row = result.first();
            res.type(row['filename']);
            res.send(row['contents']);
        })
        .catch(function(error) {
            console.log("Error retrieving file with id: " + id + ", Error: " + error);
            res.json({status: "OK"});
        });
    });

};