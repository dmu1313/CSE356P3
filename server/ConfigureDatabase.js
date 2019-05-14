

var mongoUtil = require('./MongoUtils.js');
var elasticClient = require('./ElasticUtils.js');
var cassandraUtils = require('./CassandraUtils.js');

let constants = require('./Utils.js');
const STATUS_OK = constants.STATUS_OK;

const COLLECTION_USERS = constants.COLLECTION_USERS;
const COLLECTION_COOKIES = constants.COLLECTION_COOKIES;
const COLLECTION_QUESTIONS = constants.COLLECTION_QUESTIONS;
const COLLECTION_ANSWERS = constants.COLLECTION_ANSWERS;
const COLLECTION_IP_VIEWS = constants.COLLECTION_IP_VIEWS;
const COLLECTION_USER_VIEWS = constants.COLLECTION_USER_VIEWS;
const COLLECTION_MEDIA = constants.COLLECTION_MEDIA;
const COLLECTION_MEDIA_USER = constants.COLLECTION_MEDIA_USER;

const COLLECTION_ANSWER_UPVOTE = constants.COLLECTION_ANSWER_UPVOTE;
const COLLECTION_QUESTION_UPVOTE = constants.COLLECTION_QUESTION_UPVOTE;

// Already Set

// cookie: { _id, val:string, username:string, userId:string }
// user: { _id, userID:string, username:string, password:string, email:string, reputation:int, verified:boolean, key:"string" }
// questions: { _id, questionID:string, userId, title, body, score, view_count, answer_count, timestamp, tags, media, has_media:boolean accepted_answer_id, accepted:boolean, username }
// answers: { _id, answerID:string, questionId, body, media, userId, score:int, accepted:boolean, timestamp, username }
// ip_views: { _id, ip:string, questionID:string }
// user_views: { _id, username:string, questionId:string }

// COLLECTION_MEDIA: {_id: mediaId, qa: questionId/answerId}
// COLLECTION_MEDIA_USER: {_id: mediaId, userId: userId};

// Combined:
// COLLECTION_MEDIA: {_id: mediaId, qa: questionId/answerId, uid: userId}



// q_upvote: {_id, uid=userId, qid=questionId, val:boolean, waived:boolean}
// a_upvote: {_id, uid=userId, aid=answerId, val:boolean, waived:boolean}



/********************************
 * 
 *    Eventually add support for timing out cookies.
 * 
 *************************/


module.exports = function(app) {

    app.get('/DropDatabase', function(req, res) {
        var cassandraClient = cassandraUtils.getCassandraClient();
        var cassandraKeyspace = cassandraUtils.cassandraKeyspace;

        var deleteKeyspaceQuery = "DROP KEYSPACE " + cassandraKeyspace;
    
        cassandraClient.execute(deleteKeyspaceQuery)
        .then(function(result) {
            console.log("Deleted keyspace: " + result);
        })
        .catch(function(error) {
            console.log("Error dropping cassandra keyspace: " + error);
        });

        var client = elasticClient.getElasticClient();
        client.indices.delete({
            index: 'questions'
        })
        .then(function(ret) {
            console.log("Dropped ElasticSearch index: Questions. ret: " + ret);
        })
        .catch(function(error) {
            console.log("ElasticSearch failed to delete index: Questions. Error: " + error);
        });

        var db = mongoUtil.getDB();
        
        db.collection(COLLECTION_USERS).deleteMany({})
        .then(function(res) {
            console.log("Wiped COLLECTION_USERS: " + res);
        })
        .catch(function(error) {
            console.log("Failed to wipe COLLECTION_USERS, Error: " + error);
        });
        
        db.collection(COLLECTION_COOKIES).deleteMany({})
        .then(function(res) {
            console.log("Wiped COLLECTION_COOKIES: " + res);
        })
        .catch(function(error) {
            console.log("Failed to wipe COLLECTION_COOKIES, Error: " + error);
        });

        db.collection(COLLECTION_QUESTIONS).deleteMany({})
        .then(function(res) {
            console.log("Wiped COLLECTION_QUESTIONS: " + res);
        })
        .catch(function(error) {
            console.log("Failed to wipe COLLECTION_QUESTIONS, Error: " + error);
        });

        db.collection(COLLECTION_ANSWERS).deleteMany({})
        .then(function(res) {
            console.log("Wiped COLLECTION_ANSWERS: " + res);
        })
        .catch(function(error) {
            console.log("Failed to wipe COLLECTION_ANSWERS, Error: " + error);
        });

        db.collection(COLLECTION_IP_VIEWS).deleteMany({})
        .then(function(res) {
            console.log("Wiped COLLECTION_IP_VIEWS: " + res);
        })
        .catch(function(error) {
            console.log("Failed to wipe COLLECTION_IP_VIEWS, Error: " + error);
        });

        db.collection(COLLECTION_USER_VIEWS).deleteMany({})
        .then(function(res) {
            console.log("Wiped COLLECTION_USER_VIEWS: " + res);
        })
        .catch(function(error) {
            console.log("Failed to wipe COLLECTION_USER_VIEWS, Error: " + error);
        });

        db.collection(COLLECTION_ANSWER_UPVOTE).deleteMany({})
        .then(function(res) {
            console.log("Wiped COLLECTION_ANSWER_UPVOTE: " + res);
        })
        .catch(function(error) {
            console.log("Failed to wipe COLLECTION_ANSWER_UPVOTE, Error: " + error);
        });

        db.collection(COLLECTION_QUESTION_UPVOTE).deleteMany({})
        .then(function(res) {
            console.log("Wiped COLLECTION_QUESTION_UPVOTE: " + res);
        })
        .catch(function(error) {
            console.log("Failed to wipe COLLECTION_QUESTION_UPVOTE, Error: " + error);
        });

        db.collection(COLLECTION_MEDIA).deleteMany({})
        .then(function(res) {
            console.log("Wiped COLLECTION_MEDIA: " + res);
        })
        .catch(function(error) {
            console.log("Failed to wipe COLLECTION_MEDIA, Error: " + error);
        });

        db.collection(COLLECTION_MEDIA_USER).deleteMany({})
        .then(function(res) {
            console.log("Wiped COLLECTION_MEDIA_USER: " + res);
        })
        .catch(function(error) {
            console.log("Failed to wipe COLLECTION_MEDIA_USER, Error: " + error);
        });

        // db.dropDatabase(function(error, result) {
        //     if (error) console.log("Error: " + error);
        //     console.log("Drop database: " + result);
            // mongoUtil.getRealDB().close();
            // .then(function(error, result) {
            //     console.log("ERROR: " + error);
            //     console.log("RESULT: " + result);
            //     mongoUtil.connect();
            // });
            // db.collection("testing").insertOne({ obj: "bye" });
        // });

        res.json(STATUS_OK);
    });

    app.get("/DeleteDatabase", function(req, res) {
        var cassandraClient = cassandraUtils.getCassandraClient();
        var cassandraKeyspace = cassandraUtils.cassandraKeyspace;

        var deleteKeyspaceQuery = "DROP KEYSPACE " + cassandraKeyspace;
    
        cassandraClient.execute(deleteKeyspaceQuery)
        .then(function(result) {
            console.log("Deleted keyspace: " + result);
        })
        .catch(function(error) {
            console.log("Error dropping cassandra keyspace: " + error);
        });

        var client = elasticClient.getElasticClient();
        client.indices.delete({
            index: 'questions'
        })
        .then(function(ret) {
            console.log("Dropped ElasticSearch index: Questions. ret: " + ret);
        })
        .catch(function(error) {
            console.log("ElasticSearch failed to delete index: Questions. Error: " + error);
        });

        var db = mongoUtil.getDB();
        
        db.collection(COLLECTION_COOKIES).deleteMany({})
        .then(function(result) {
            console.log(result.result.n + " deleted from COLLECTION_COOKIES");
        })
        .catch(function(error) {
            console.log("Error deleting from COLLECTION_COOKIES: " + error);
        });

        db.collection(COLLECTION_ANSWERS).deleteMany({})
        .then(function(result) {
            console.log(result.result.n + " deleted from COLLECTION_ANSWERS");
        })
        .catch(function(error) {
            console.log("Error deleting from COLLECTION_ANSWERS: " + error);
        });

        db.collection(COLLECTION_USERS).deleteMany({})
        .then(function(result) {
            console.log(result.result.n + " deleted from COLLECTION_USERS");
        })
        .catch(function(error) {
            console.log("Error deleting from COLLECTION_USERS: " + error);
        });

        db.collection(COLLECTION_QUESTIONS).deleteMany({})
        .then(function(result) {
            console.log(result.result.n + " deleted from COLLECTION_QUESTIONS");
        })
        .catch(function(error) {
            console.log("Error deleting from COLLECTION_QUESTIONS: " + error);
        });

        db.collection(COLLECTION_IP_VIEWS).deleteMany({})
        .then(function(result) {
            console.log(result.result.n + " deleted from COLLECTION_IP_VIEWS");
        })
        .catch(function(error) {
            console.log("Error deleting from COLLECTION_IP_VIEWS: " + error);
        });

        db.collection(COLLECTION_USER_VIEWS).deleteMany({})
        .then(function(result) {
            console.log(result.result.n + " deleted from COLLECTION_USER_VIEWS");
        })
        .catch(function(error) {
            console.log("Error deleting from COLLECTION_USER_VIEWS: " + error);
        });

        db.collection(COLLECTION_ANSWER_UPVOTE).deleteMany({})
        .then(function(result) {
            console.log(result.result.n + " deleted from COLLECTION_ANSWER_UPVOTE");
        })
        .catch(function(error) {
            console.log("Error deleting from COLLECTION_ANSWER_UPVOTE: " + error);
        });

        db.collection(COLLECTION_QUESTION_UPVOTE).deleteMany({})
        .then(function(result) {
            console.log(result.result.n + " deleted from COLLECTION_QUESTION_UPVOTE");
        })
        .catch(function(error) {
            console.log("Error deleting from COLLECTION_QUESTION_UPVOTE: " + error);
        });


        res.json(STATUS_OK);
    });

    app.get('/init', function(req, res) {
        var db = mongoUtil.getDB();

        db.collection(COLLECTION_USERS).insertOne({ testField: 0 });
        db.collection(COLLECTION_COOKIES).insertOne({ val:"hi", username:"hi" });
        db.collection(COLLECTION_ANSWERS).insertOne({ testField: 0 });
        db.collection(COLLECTION_QUESTIONS).insertOne({ testField: 0 });
        db.collection(COLLECTION_IP_VIEWS).insertOne({ ip: "hi", questionId: "hi" });
        db.collection(COLLECTION_USER_VIEWS).insertOne({userId: "hi", questionId: "hi"});
        res.json(STATUS_OK);
    });

    app.get('/ConfigureDatabase', function(req, res) {
        var cassandraClient = cassandraUtils.getCassandraClient();
        var cassandraKeyspace = cassandraUtils.cassandraKeyspace;
        var cassandraTable = cassandraUtils.cassandraTable;
        var cassandraFullName = cassandraUtils.cassandraFullName;

        var createKeyspaceQuery = "CREATE KEYSPACE IF NOT EXISTS " + cassandraKeyspace +
                                    " WITH replication = {'class': 'SimpleStrategy', 'replication_factor': '1' }";
        var createTableQuery = "CREATE TABLE IF NOT EXISTS " + cassandraFullName +
                                " (id text, filename text, contents blob, PRIMARY KEY(id)) WITH gc_grace_seconds=180";
    
        cassandraClient.execute(createKeyspaceQuery)
        .then(function(result) {
            console.log("Created keyspace: " + result);
            return cassandraClient.execute(createTableQuery);
        })
        .then(function(result) {
            console.log("Created table: " + result);
        })
        .catch(function(error) {
            console.log("Error configuring cassandra: " + error);
        });



        var client = elasticClient.getElasticClient();
        client.indices.create({
            index: 'questions',
            body: {
                settings : {
                    index : {
                        number_of_shards : 6, 
                        number_of_replicas : 0 
                    }
                }
            }
        })
        .then(function(ret) {
            console.log("Created ElasticSearch index: Questions. ret: " + ret);
        })
        .catch(function(error) {
            console.log("ElasticSearch failed to create index: Questions. Error: " + error);
        });
        
        // client.cluster.

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
                                                            { key: {timestamp: 1, questionId: 1} },
                                                            { key: {timestamp: 1} },
                                                            { key: {userId: 1} },
                                                            { key: {username: 1} },
                                                            { key: {has_media: 1, accepted: 1, timestamp: -1, score: -1} },
                                                            { key: {accepted: 1, timestamp: -1, score: -1} },
                                                            { key: {timestamp: -1, score: -1} }
                                                        ])
        .then(function(result) {
            console.log("Questions Index: " + result);
        })
        .catch(function(error) {
            console.log("QUESTIONS: " + error);
        });
        
        db.collection(COLLECTION_ANSWERS).createIndexes([
                                                            { key: {answerId: 1} },
                                                            { key: {questionId: 1} },
                                                            { key: {username: 1}}
                                                        ])
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

        db.collection(COLLECTION_IP_VIEWS).createIndex( { questionId: 1, ip: 1 } )
        .then(function(result) {
            console.log("Ip_View index: " + result);
        })
        .catch(function(error) {
            console.log("IP_VIEW: " + error);
        });

        db.collection(COLLECTION_USER_VIEWS).createIndex( { questionId: 1, username: 1 } )
        .then(function(result) {
            console.log("User_View index: " + result);
        })
        .catch(function(error) {
            console.log("USER_VIEW: " + error);
        });


        // MEDIA_USER {the media id, the user id}
        // MEDIA {the media id, the Q/A id}
        // media: { _id=questionId/answerId, mediaId }

        // db.collection(COLLECTION_MEDIA).createIndex( { mediaId: 1  })
        // .then(function(result) {
        //     console.log("media index: " + result);
        // })
        // .catch(function(error) {
        //     console.log("MEDIA ERROR: " + error);
        // });

        // db.collection(COLLECTION_MEDIA_USER).createIndex( {} )
        // .then(function(result) {
        //     console.log("media_user index: " + result);
        // })
        // .catch(function(error) {
        //     console.log("MEDIA_USER ERROR: " + error);
        // });





        db.collection(COLLECTION_QUESTION_UPVOTE).createIndex( { uid: 1, qid: 1 } )
        .then(function(result) {
            console.log("Q_upvote index: " + result);
        })
        .catch(function(error) {
            console.log("Q_UPVOTE: " + error);
        });

        db.collection(COLLECTION_ANSWER_UPVOTE).createIndex( {uid: 1, aid: 1})
        .then(function(result) {
            console.log("A_upvote index: " + result);
        })
        .catch(function(error) {
            console.log("A_UPVOTE: " + error);
        });


        res.json(STATUS_OK);
    });

};