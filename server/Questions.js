
var mongoUtil = require('./MongoUtils.js');

let constants = require('./Utils.js');
const STATUS_OK = constants.STATUS_OK;

const COLLECTION_USERS = constants.COLLECTION_USERS;
const COLLECTION_COOKIES = constants.COLLECTION_COOKIES;
const COLLECTION_QUESTIONS = constants.COLLECTION_QUESTIONS;
const COLLECTION_ANSWERS = constants.COLLECTOIN_ANSWERS;
const COLLECTION_IP = constants.COLLECTION_IP;

module.exports = function(app) {

    app.get('/questions/:id', function(req, res) {
        var id = req.params.id;
        req.ip;
        res.json(STATUS_OK);
    });

    app.post('/questions/add', function(req, res) {

    });

    app.post('/questions/:id/answers/add', function(req, res) {
        var id = req.params.id;

    });

    app.get('/questions/:id/answers', function(req, res) {
        var id = req.params.id;
    });

};