
var mongo = require('mongodb').MongoClient;
// const url = "mongodb://192.168.122.13:27017";
const url = "mongodb://130.245.171.117:27017";
// const url = "mongodb://localhost:27017";

let constants = require('./Utils.js');
const DATABASE = constants.DATABASE;

const COLLECTION_USERS = constants.COLLECTION_USERS;
const COLLECTION_COOKIES = constants.COLLECTION_COOKIES;
const COLLECTION_QUESTIONS = constants.COLLECTION_QUESTIONS;
const COLLECTION_ANSWERS = constants.COLLECTION_ANSWERS;

var _db;
var _realdb;

var questionArray = [];

mongo.connect(url)
.then(async function(db) {
    _realdb = db;
    _db = db.db(DATABASE);
    let cursor = await _db.collection(COLLECTION_QUESTIONS).find();

    while (await cursor.hasNext()) {
        let questionDoc = await cursor.next();
        questionArray.push(questionDoc);
    }

    for (let i = 0; i < questionArray.length; i++) {
        let userDoc = await _db.collection(COLLECTION_USERS).findOne({userId: questionArray[i].userId});
        if (userDoc == null) {
            console.log("questionId: " + questionArray[i].questionId);
            console.log("userId: " + questionArray[i].userId);
        }
    }
})
.catch(function(error) {
    console.log("Error: " + error);
});
