
var mongo = require('mongodb').MongoClient;
const url = "mongodb://localhost:27017";

let constants = require('./Utils.js');
const DATABASE = constants.DATABASE;

const COLLECTION_USERS = constants.COLLECTION_USERS;
const COLLECTION_COOKIES = constants.COLLECTION_COOKIES;
const COLLECTION_QUESTIONS = constants.COLLECTION_QUESTIONS;
const COLLECTION_ANSWERS = constants.COLLECTOIN_ANSWERS;

var _db;
var _realdb;


function checkIfUserLoggedIn(cookieString) {
    var cookieQuery = { val: cookieString };

    return _db.collection(COLLECTION_COOKIES).findOne(cookieQuery)
    .then(function(doc) {
        return doc != null;
    })
    .catch(function(error) {
        console.log("Error checking if user is logged in with cookie: " + error);
        return false;
    });
}



module.exports = {
    connect: function() {
        mongo.connect(url, function(error, db) {
            _realdb = db;
            _db = db.db(DATABASE);
            if (error) {
                console.log("Error connecting to MongoDB: " + error);
            }
        });
    },
    getDB: function() {
        return _db;
    },
    getRealDB: function() {
        return _realdb;
    },
    checkIfUserLoggedIn: checkIfUserLoggedIn
};
