
var loggerUtils = require('./LoggerUtils.js');
var logger = loggerUtils.getAppLogger();

const util = require('util');

var elasticUtils = require('./ElasticUtils.js');
var mongoUtil = require('./MongoUtils.js');

let constants = require('./Utils.js');
const STATUS_OK = constants.STATUS_OK;

var getUnixTime = constants.getUnixTime;

const COLLECTION_USERS = constants.COLLECTION_USERS;
const COLLECTION_COOKIES = constants.COLLECTION_COOKIES;
const COLLECTION_QUESTIONS = constants.COLLECTION_QUESTIONS;
const COLLECTION_ANSWERS = constants.COLLECTOIN_ANSWERS;
const COLLECTION_IP = constants.COLLECTION_IP;

module.exports = function(app) {
    app.post('/search', async function(req, res) {
        logger.debug("/////////////////////////////////////");
        logger.debug("/search");
        var client = elasticUtils.getElasticClient();
        var db = mongoUtil.getDB();

        try {
            var timestamp = req.body.timestamp;
            var limit = req.body.limit;
            var q = req.body.q;
            var sort_by = req.body.sort_by;
            var tagsArray = req.body.tags;
            var has_media = req.body.has_media;
            var accepted = req.body.accepted;

            if (sort_by != "timestamp") sort_by = "score";
            if (has_media == null) has_media = false;
            if (accepted == null) accepted = false;

            var tags = "";
            if (tagsArray != null) {
                tags = tagsArray.join(" ");
            }

            logger.debug("search");
            logger.debug("Timestamp: " + timestamp);
            logger.debug("Limit: " + limit);
            logger.debug("q: " + q);
            logger.debug("sort_by: " + sort_by);
            logger.debug("tags: " + tags);
            logger.debug("has_media: " + has_media);
            logger.debug("accepted: " + accepted);

            var matches;
            if (q != null && q != "") {
                // Perform elastic search
                if (tags == "") {
                    const { body } = await client.search({
                        index: 'questions',
                        body: {
                            size: 1000,
                            query: {
                                multi_match: {
                                    query: q,
                                    fields: ["title", "body"]
                                }
                            }
                        }
                    });

                    matches = body.hits.hits;
                }
                else {
                    const { body } = await client.search({
                        index: 'questions',
                        body: {
                            size: 10000,
                            query: {
                                bool: {
                                    must: [
                                        {
                                            multi_match: {
                                                query: q,
                                                fields: ["title", "body"]
                                            }
                                        },
                                        {
                                            match: {
                                                tags: {
                                                    query: tags,
                                                    operator: "and"
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    });

                    matches = body.hits.hits;
                }
                // logger.debug(util.inspect(body, {showHidden: false, depth: null}));
                // logger.debug("body: " +  body);
                
            }
            else if (tags != "") {
                const { body } = await client.search({
                    index: 'questions',
                    body: {
                        size: 10000,
                        query: {
                            match: {
                                tags: {
                                    query: tags,
                                    operator: "and"
                                }
                            }
                        }
                    }
                });

                matches = body.hits.hits;
            }

            var stringMatchedIds = [];
            if (matches != null) {
                for (let i = 0; i < matches.length; i++) {
                    stringMatchedIds.push(matches[i]._source.id);
                    logger.debug("Available ID: " + matches[i]._source.id);
                }
            }

            var searchQuery = {};
            if (timestamp != null) {
                timestamp = Math.floor(timestamp);
                searchQuery = { timestamp: {$lte: timestamp} }
            }
            // else {
            //     timestamp = getUnixTime();
            // }

            if (stringMatchedIds.length > 0) {
                searchQuery.questionId = {$in: stringMatchedIds};
                // searchQuery = {timestamp: {$lte: timestamp}, questionId: { $in: stringMatchedIds } }
            }

            if (has_media) {
                searchQuery.has_media = has_media;
            }
            if (accepted) {
                searchQuery.accepted = accepted;
            }

            if (limit == null) {
                limit = 25;
            }
            else if (limit < 0) limit = 0;
            else if (limit > 100) limit = 100;

            var questionsArray = [];

            var cursor;
            if (sort_by == "timestamp") {
                cursor = await db.collection(COLLECTION_QUESTIONS).find(searchQuery).sort({ timestamp: -1 }).limit(limit);
            }
            else {
                cursor = await db.collection(COLLECTION_QUESTIONS).find(searchQuery).sort({ score: -1 }).limit(limit);
            }

            logger.debug("1");
            while (await cursor.hasNext()) {
                logger.debug("2");
                let questionDoc = await cursor.next();
                logger.debug("3");
                let userDoc = await db.collection(COLLECTION_USERS).findOne({userId: questionDoc.userId});
                logger.debug("4");
                var question = {
                    id: questionDoc.questionId, user: { username: userDoc.username, reputation: userDoc.reputation },
                    title: questionDoc.title, body: questionDoc.body, score: questionDoc.score, view_count: questionDoc.view_count,
                    answer_count: questionDoc.answer_count, timestamp: questionDoc.timestamp, media: questionDoc.media,
                    tags: questionDoc.tags, accepted_answer_id: questionDoc.accepted_answer_id
                };
                questionsArray.push(question);
            }
            for (var i = 0; i < questionsArray.length; i++) {
                logger.debug(questionsArray[i]);
            }
            logger.debug("5");
            res.json({status: "OK", questions: questionsArray});
        }
        catch(error) {
            logger.debug("Failed to do search. Error: " + error);
            res.status(400).json({status: "error", error: "Failed to do the search query."});
        }
    });
}
