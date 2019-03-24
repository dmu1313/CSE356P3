

var mongoUtil = require('./MongoUtils.js');

let constants = require('./Utils.js');
const STATUS_OK = constants.STATUS_OK;

const COLLECTION_USERS = constants.COLLECTION_USERS;
const COLLECTION_COOKIES = constants.COLLECTION_COOKIES;
const COLLECTION_QUESTIONS = constants.COLLECTION_QUESTIONS;
const COLLECTION_ANSWERS = constants.COLLECTION_ANSWERS;
const COLLECTION_IP = constants.COLLECTION_IP;

// cookie: { _id, val:string, username:string }
// user: { _id, userID:string, username:string, password:string, email:string, reputation:int, verified:boolean, key:"string" }
// questions: { _id, questionID:string, userID, title, body, score, view_count, answer_count, timestamp, tags, media, accepted_answer_id, accepted:boolean }
// answers: { _id, answerID:string, questionId, body, media, userID, score:int, accepted:boolean, timestamp }
// ip: { _id, ip:string, questionID:string }





/********************************
 * 
 *    Eventually add support for timing out cookies.
 * 
 *************************/


module.exports = function(app) {

    app.get('/DropDatabase', function(req, res) {
        var db = mongoUtil.getDB();
        db.dropDatabase(function(error, result) {
            if (error) console.log("Error: " + error);
            console.log("Drop database: " + result);
            // mongoUtil.getRealDB().close();
            // .then(function(error, result) {
            //     console.log("ERROR: " + error);
            //     console.log("RESULT: " + result);
            //     mongoUtil.connect();
            // });
            // db.collection("testing").insertOne({ obj: "bye" });
        });
        res.json(STATUS_OK);
    });

    app.get('/init', function(req, res) {
        var db = mongoUtil.getDB();

        db.collection(COLLECTION_USERS).insertOne({ testField: 0 });
        db.collection(COLLECTION_COOKIES).insertOne({ val:"hi", username:"hi" });
        db.collection(COLLECTION_ANSWERS).insertOne({ testField: 0 });
        db.collection(COLLECTION_QUESTIONS).insertOne({ testField: 0 });
        db.collection(COLLECTION_IP).insertOne({ ip: "hi", questionId: "hi" });
        res.json(STATUS_OK);
    });

    app.get('/ConfigureDatabase', function(req, res) {
        var db = mongoUtil.getDB();

        db.collection(COLLECTION_USERS).createIndexes([
                                                        { key: {userId: 1} },
                                                        { key: {username: 1} },
                                                        { key: {email: 1} }
                                                    ])
        .then(function(result) {
            console.log("Users Index: " + result);
        })
        .catch(function(error) {
            console.log("USERS: " + error);
        });
        
        db.collection(COLLECTION_QUESTIONS).createIndexes([
                                                            { key: {questionId: 1} },
                                                            { key: {accepted: 1, timestamp: 1} },
                                                            { key: {timestamp: 1} }
                                                        ])
        .then(function(result) {
            console.log("Questions Index: " + result);
        })
        .catch(function(error) {
            console.log("QUESTIONS: " + error);
        });
        
        db.collection(COLLECTION_ANSWERS).createIndex({ questionId: 1 })
        .then(function(result) {
            console.log("Answers Index: " + result);
        })
        .catch(function(error) {
            console.log("ANSWERS: " + error);
        });

        db.collection(COLLECTION_COOKIES).createIndex( { val: 1 } )
        .then(function(result) {
            console.log("Cookies Index: " + result);
        })
        .catch(function(error) {
            console.log("COOKIES: " + error);
        });

        db.collection(COLLECTION_IP).createIndex( { ip: 1, questionId: 1 } )
        .then(function(result) {
            console.log("Ip index: " + result);
        })
        .catch(function(error) {
            console.log("IP: " + error);
        });

        res.json(STATUS_OK);
    });

};