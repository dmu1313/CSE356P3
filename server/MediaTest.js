

module.exports = function(app) {
    const STATUS_OK = constants.STATUS_OK;
    const STATUS_ERROR = constants.STATUS_ERROR;
    
    const COLLECTION_USERS = constants.COLLECTION_USERS;
    const COLLECTION_COOKIES = constants.COLLECTION_COOKIES;
    const COLLECTION_QUESTIONS = constants.COLLECTION_QUESTIONS;
    const COLLECTION_ANSWERS = constants.COLLECTOIN_ANSWERS;
    
    var getRandomIdString = constants.getRandomIdString;

    let mongoUtil = require('./MongoUtils');

};

