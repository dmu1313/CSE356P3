
var mongoUtil = require('./MongoUtils.js');

let constants = require('./Utils.js');
const STATUS_OK = constants.STATUS_OK;

const COLLECTION_USERS = constants.COLLECTION_USERS;
const COLLECTION_COOKIES = constants.COLLECTION_COOKIES;
const COLLECTION_QUESTIONS = constants.COLLECTION_QUESTIONS;
const COLLECTION_ANSWERS = constants.COLLECTOIN_ANSWERS;
const COLLECTION_IP = constants.COLLECTION_IP;

module.exports = function(app) {
    app.post('/search', async function(req, res) {
        try {
            var timestamp = req.body.timestamp;
            var limit = req.body.limit;

            console.log("search");
            console.log("Timestamp: " + timestamp);
            console.log("Limit: " + limit);

            var db = mongoUtil.getDB();

            var searchQuery = {};
            if (timestamp != null) {
                searchQuery = { timestamp: {$lte: timestamp} }
            }
            
            if (limit == null) {
                limit = 25;
            }
            else if (limit < 0) limit = 0;
            else if (limit > 100) limit = 100;

            var questionsArray = [];

            var cursor = await db.collection(COLLECTION_QUESTIONS).find(searchQuery).sort({ timestamp: -1 }).limit(limit);
            console.log("1");
            while (await cursor.hasNext()) {
                console.log("2");
                let questionDoc = await cursor.next();
                console.log("3");
                let userDoc = await db.collection(COLLECTION_USERS).findOne({userId: questionDoc.userId});
                console.log("4");
                var question = {
                    id: questionDoc.questionId, user: { username: userDoc.username, reputation: userDoc.reputation },
                    title: questionDoc.title, body: questionDoc.body, score: questionDoc.score, view_count: questionDoc.view_count,
                    answer_count: questionDoc.answer_count, timestamp: questionDoc.timestamp, media: questionDoc.media,
                    tags: questionDoc.tags, accepted_answer_id: questionDoc.accepted_answer_id
                };
                questionsArray.push(question);
            }
            console.log("5");
            res.json({status: "OK", questions: questionsArray});
        }
        catch(error) {
            console.log("Failed to do search. Error: " + error);
            res.json({status: "error", error: "Failed to do the search query."});
        }
    });
}
