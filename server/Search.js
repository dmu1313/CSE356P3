
var mongoUtil = require('./MongoUtils.js');

let constants = require('./Utils.js');
const STATUS_OK = constants.STATUS_OK;

const COLLECTION_USERS = constants.COLLECTION_USERS;
const COLLECTION_COOKIES = constants.COLLECTION_COOKIES;
const COLLECTION_QUESTIONS = constants.COLLECTION_QUESTIONS;
const COLLECTION_ANSWERS = constants.COLLECTOIN_ANSWERS;
const COLLECTION_IP = constants.COLLECTION_IP;

module.exports = function(app) {
    app.post('/search', function(req, res) {
        var timestamp = req.body.timestamp;
        var limit = req.body.limit;

        var db = mongoUtil.getDB();

        var searchQuery;
        if (timestamp != null) {
            searchQuery = { timestamp: {$lte: timestamp} }
        }
        
        if (limit == null) {
            limit = 25;
        }
        else if (limit < 0) limit = 0;
        else if (limit > 100) limit = 100;

        var questionsArray = [];

        var searchSuccess = false;
        db.collection(COLLECTION_QUESTIONS).find(searchQuery).sort({ timestamp: -1 }).limit(limit)
        .then(function(docs) {
            if (docs == null) {
                console.log("Search query led to a null cursor from MongoDB.");
                return null;
            }
            return docs.forEach(function(doc) {
                var userPosterQuery = { userId: doc.userId };
                db.collection(COLLECTION_USERS).findOne(userPosterQuery)
                .then(function(userDoc) {
                    if (userDoc == null) {
                        console.log("User who posted question with id: " + doc.questionId + " could not be found with userId: " + doc.userId);
                        return;
                    }
                    var question = {
                        id: doc.questionId, user: { username: userDoc.username, reputation: userDoc.reputation },
                        title: doc.title, body: doc.body, score: doc.score, view_count: doc.view_count,
                        answer_count: doc.answer_count, timestamp: doc.timestamp, media: doc.media, tags: doc.tags,
                        accepted_answer_id: doc.accepted_answer_id
                    };
                    questionsArray.push(question);

                })
                .catch(function(error) {
                    console.log("Failed to find user for question. Error: " + error);
                });
            });
        })
        .then(function(ret) {
            if (ret == null) {
                console.log("Search query failed.");
                searchSuccess = false;
            }
            else {
                console.log("Search query succeeded: " + ret);
                searchSuccess = true;
            }
        })
        .catch(function(error) {
            console.log("The search query failed somewhere in the process. Error: " + error);
            searchSuccess = false;
        })
        .finally(function() {
            if (searchSuccess) {
                res.json({status: "OK", questions: questionsArray});
            }
            else {
                res.json({status: "error", questions: [], error: "Failed to do the search query."});
            }
        });
    });
}
