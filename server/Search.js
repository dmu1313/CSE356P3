
var mongoUtil = require('./MongoUtils.js');

let constants = require('./Utils.js');
const STATUS_OK = constants.STATUS_OK;

const COLLECTION_USERS = constants.COLLECTION_USERS;
const COLLECTION_COOKIES = constants.COLLECTION_COOKIES;
const COLLECTION_QUESTIONS = constants.COLLECTION_QUESTIONS;
const COLLECTION_ANSWERS = constants.COLLECTOIN_ANSWERS;
const COLLECTION_IP = constants.COLLECTION_IP;

module.exports = function(app) {
    app.post('/search', function(res, req) {
        res.json(STATUS_OK);
    });
}
