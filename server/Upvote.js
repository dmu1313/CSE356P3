
var loggerUtils = require('./LoggerUtils.js');
var logger = loggerUtils.getAppLogger();

const util = require('util');
var mongoUtil = require('./MongoUtils.js');

let constants = require('./Utils.js');
const STATUS_OK = constants.STATUS_OK;
const STATUS_ERROR = constants.STATUS_ERROR;

const COLLECTION_USERS = constants.COLLECTION_USERS;
const COLLECTION_QUESTIONS = constants.COLLECTION_QUESTIONS;
const COLLECTION_ANSWERS = constants.COLLECTION_ANSWERS;
const COLLECTION_QUESTION_UPVOTE = constants.COLLECTION_QUESTION_UPVOTE;
const COLLECTION_ANSWER_UPVOTE = constants.COLLECTION_ANSWER_UPVOTE;

module.exports = function(app) {
    app.post('/questions/:id/upvote', async function(req, res) {
        var id = req.params.id;
        var upvote = req.body.upvote;
        if (upvote == null) {
            upvote = true;
        }
        logger.debug("--------------------------------");
        logger.debug("/questions/" + id + "/upvote, upvote: " + upvote);

        var cookie = req.cookies['SessionID'];
        const authErrorMessage = "Must be logged in to upvote/downvote a question.";

        // Check to see if logged in first.
        var user = await mongoUtil.getUserAndIdForCookie(cookie);
        if (user == null) {
            // Not logged in. Fail.
            logger.debug(authErrorMessage);
            res.status(401).json(STATUS_ERROR);
            return;
        }

        var db = mongoUtil.getDB();

        let questionQuery = {questionId: id};
        let questionDoc = await db.collection(COLLECTION_QUESTIONS).findOne(questionQuery);
        if (questionDoc == null) {
            logger.debug("Question with ID: " + id + " does not exist. Can't upvote/downvote");
            res.status(400).json(STATUS_ERROR);
            return;
        }

        let posterQuery = {userId: questionDoc.userId};
        let posterDoc = await db.collection(COLLECTION_USERS).findOne(posterQuery);
        if (posterDoc == null) {
            logger.debug("Could not find the original poster of the question.");
            res.status(400).json(STATUS_ERROR);
            return;
        }
        
        let upvoteQuery = {_id: user.userId, qid: id};
        let upvoteDoc = await db.collection(COLLECTION_QUESTION_UPVOTE).findOne(upvoteQuery);
        if (upvoteDoc == null) {
            logger.debug("No previous upvote/downvote for this question and user. Inserting now.");
            let insertUpvoteQuery;
            if (upvote == false) {
                if (posterDoc.reputation <= 1) {
                    insertUpvoteQuery = {_id: user.userId, qid: id, val: false, waived: true};
                }
                else {
                    insertUpvoteQuery = {_id: user.userId, qid: id, val: false, waived: false};
                }
            }
            else {
                insertUpvoteQuery = {_id: user.userId, qid: id, val: true, waived: false };
            }
            if (insertUpvoteQuery.waived == false) {
                let updateUserReputationQuery;
                if (insertUpvoteQuery.val == false) {
                    updateUserReputationQuery = {$inc: {reputation: -1}};
                }
                else {
                    updateUserReputationQuery = {$inc: {reputation: 1}};
                }
                db.collection(COLLECTION_USERS).updateOne(posterQuery, updateUserReputationQuery);
            }
            db.collection(COLLECTION_QUESTION_UPVOTE).insertOne(insertUpvoteQuery);
        }
        else {
            // Undo the vote
            if (upvoteDoc.val == upvote) {
                if (upvote == false && upvoteDoc.waived == false) {
                    let updateReputationQuery = {$inc: {reputation: 1}};
                    db.collection(COLLECTION_USERS).updateOne(posterQuery, updateReputationQuery);
                }
                else if (upvote == true) {

                    if (posterDoc.reputation > 1) {
                        let updateReputationQuery = {$inc: {reputation: -1}};
                        db.collection(COLLECTION_USERS).updateOne(posterQuery, updateReputationQuery);
                    }
                }
                db.collection(COLLECTION_QUESTION_UPVOTE).deleteOne(upvoteQuery);
            }
            else {
                if (upvote == false) {
                    let modifyUpvoteQuery;
                    let updateReputationQuery;
                    if (posterDoc.reputation <= 2) {
                        modifyUpvoteQuery = {$set: {val: false, waived: true}};
                        updateReputationQuery = {$set: {reputation: 1}};
                    }
                    else {
                        modifyUpvoteQuery = {$set: {val: false, waived: false}};
                        updateReputationQuery = {$inc: {reputation: -2}};
                    }
                    db.collection(COLLECTION_USERS).updateOne(posterQuery, updateReputationQuery);
                    db.collection(COLLECTION_QUESTION_UPVOTE).updateOne(upvoteQuery, modifyUpvoteQuery);
                }
                else {
                    // default to true
                    let modifyUpvoteQuery = {$set: {val: true, waived: false}};
                    let updateReputationQuery;

                    if (upvoteDoc.waived == false) {
                        updateReputationQuery = {$inc: {reputation: 2}};
                    }
                    else {
                        updateReputationQuery = {$inc: {reputation: 1}};
                    }
                    
                    db.collection(COLLECTION_USERS).updateOne(posterQuery, updateReputationQuery);
                    db.collection(COLLECTION_QUESTION_UPVOTE).updateOne(upvoteQuery, modifyUpvoteQuery);
                }
            }
        }

        let updateQuestionScoreQuery;
        if (upvoteDoc == null) {
            if (upvote == false) {
                updateQuestionScoreQuery = {$inc: {score: -1}};
            }
            else {
                updateQuestionScoreQuery = {$inc: {score: 1}};
            }
        }
        else {
            if (upvoteDoc.val == false) {
                if (upvote == false) {
                    updateQuestionScoreQuery = {$inc: {score: 1}};
                }
                else {
                    updateQuestionScoreQuery = {$inc: {score: 2}};
                }
            }
            else {
                if (upvote == false) {
                    updateQuestionScoreQuery = {$inc: {score: -2}};
                }
                else {
                    updateQuestionScoreQuery = {$inc: {score: -1}};
                }
            }
        }
        db.collection(COLLECTION_QUESTIONS).updateOne(questionQuery, updateQuestionScoreQuery);

        res.json(STATUS_OK);
    });
                    // q_upvote: {_id=userId, qid=questionId, val:boolean, waived:boolean}
                    // a_upvote: {_id=userId, aid=answerId, val:boolean, waived:boolean}
    app.post('/answers/:id/upvote', async function(req, res) {
        var id = req.params.id;
        var upvote = req.body.upvote;
        if (upvote == null) {
            upvote = true;
        }
        logger.debug("--------------------------------");
        logger.debug("/answers/" + id + "/upvote, upvote: " + upvote);

        var cookie = req.cookies['SessionID'];
        const authErrorMessage = "Must be logged in to upvote/downvote an answer.";

        // Check to see if logged in first.
        var user = await mongoUtil.getUserAndIdForCookie(cookie);
        if (user == null) {
            // Not logged in. Fail.
            logger.debug(authErrorMessage);
            res.status(401).json(STATUS_ERROR);
            return;
        }

        var db = mongoUtil.getDB();

        let answerQuery = {answerId: id};
        let answerDoc = await db.collection(COLLECTION_ANSWERS).findOne(answerQuery);
        if (answerDoc == null) {
            logger.debug("Answer with ID: " + id + " does not exist. Can't upvote/downvote");
            res.status(400).json(STATUS_ERROR);
            return;
        }

        let posterQuery = {userId: answerDoc.userId};
        let posterDoc = await db.collection(COLLECTION_USERS).findOne(posterQuery);
        if (posterDoc == null) {
            logger.debug("Could not find the original poster of the answer.");
            res.status(400).json(STATUS_ERROR);
            return;
        }
        
        let upvoteQuery = {_id: user.userId, aid: id};
        let upvoteDoc = await db.collection(COLLECTION_ANSWER_UPVOTE).findOne(upvoteQuery);
        if (upvoteDoc == null) {
            logger.debug("No previous upvote/downvote for this answer and user. Inserting now.");
            let insertUpvoteQuery;
            if (upvote == false) {
                if (posterDoc.reputation <= 1) {
                    insertUpvoteQuery = {_id: user.userId, aid: id, val: false, waived: true};
                }
                else {
                    insertUpvoteQuery = {_id: user.userId, aid: id, val: false, waived: false};
                }
            }
            else {
                insertUpvoteQuery = {_id: user.userId, aid: id, val: true, waived: false };
            }
            if (insertUpvoteQuery.waived == false) {
                let updateUserReputationQuery;
                if (insertUpvoteQuery.val == false) {
                    updateUserReputationQuery = {$inc: {reputation: -1}};
                }
                else {
                    updateUserReputationQuery = {$inc: {reputation: 1}};
                }
                db.collection(COLLECTION_USERS).updateOne(posterQuery, updateUserReputationQuery);
            }
            db.collection(COLLECTION_ANSWER_UPVOTE).insertOne(insertUpvoteQuery);
        }
        else {
            // Undo the vote
            if (upvoteDoc.val == upvote) {
                if (upvote == false && upvoteDoc.waived == false) {
                    let updateReputationQuery = {$inc: {reputation: 1}};
                    db.collection(COLLECTION_USERS).updateOne(posterQuery, updateReputationQuery);
                }
                else if (upvote == true) {
                    if (posterDoc.reputation > 1) {
                        let updateReputationQuery = {$inc: {reputation: -1}};
                        db.collection(COLLECTION_USERS).updateOne(posterQuery, updateReputationQuery);
                    }
                }
                db.collection(COLLECTION_ANSWER_UPVOTE).deleteOne(upvoteQuery);
            }
            else {
                if (upvote == false) {
                    let modifyUpvoteQuery;
                    let updateReputationQuery;
                    if (posterDoc.reputation <= 2) {
                        modifyUpvoteQuery = {$set: {val: false, waived: true}};
                        updateReputationQuery = {$set: {reputation: 1}};
                    }
                    else {
                        modifyUpvoteQuery = {$set: {val: false, waived: false}};
                        updateReputationQuery = {$inc: {reputation: -2}};
                    }
                    db.collection(COLLECTION_USERS).updateOne(posterQuery, updateReputationQuery);
                    db.collection(COLLECTION_ANSWER_UPVOTE).updateOne(upvoteQuery, modifyUpvoteQuery);
                }
                else {
                    // default to true
                    let modifyUpvoteQuery = {$set: {val: true, waived: false}};
                    let updateReputationQuery;

                    if (upvoteDoc.waived == false) {
                        updateReputationQuery = {$inc: {reputation: 2}};
                    }
                    else {
                        updateReputationQuery = {$inc: {reputation: 1}};
                    }
                    
                    db.collection(COLLECTION_USERS).updateOne(posterQuery, updateReputationQuery);
                    db.collection(COLLECTION_ANSWER_UPVOTE).updateOne(upvoteQuery, modifyUpvoteQuery);
                }
            }
        }

        let updateAnswerScoreQuery;
        if (upvoteDoc == null) {
            if (upvote == false) {
                updateAnswerScoreQuery = {$inc: {score: -1}};
            }
            else {
                updateAnswerScoreQuery = {$inc: {score: 1}};
            }
        }
        else {
            if (upvoteDoc.val == false) {
                if (upvote == false) {
                    updateAnswerScoreQuery = {$inc: {score: 1}};
                }
                else {
                    updateAnswerScoreQuery = {$inc: {score: 2}};
                }
            }
            else {
                if (upvote == false) {
                    updateAnswerScoreQuery = {$inc: {score: -2}};
                }
                else {
                    updateAnswerScoreQuery = {$inc: {score: -1}};
                }
            }
        }
        db.collection(COLLECTION_ANSWERS).updateOne(answerQuery, updateAnswerScoreQuery);
        res.json(STATUS_OK);
    });
};
