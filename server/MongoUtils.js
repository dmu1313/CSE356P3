
var loggerUtils = require('./LoggerUtils.js');
var logger = loggerUtils.getAppLogger();

var mongo = require('mongodb').MongoClient;
const url = "mongodb://192.168.122.36:27017";
// const url = "mongodb://localhost:27017";

var memcachedUtils = require('./MemcachedUtils.js');

let constants = require('./Utils.js');
const DATABASE = constants.DATABASE;

const COLLECTION_USERS = constants.COLLECTION_USERS;
const COLLECTION_COOKIES = constants.COLLECTION_COOKIES;
const COLLECTION_QUESTIONS = constants.COLLECTION_QUESTIONS;
const COLLECTION_ANSWERS = constants.COLLECTION_ANSWERS;

var _db;
var _realdb;

function checkIfUserLoggedIn(cookieString) {
    var cookieQuery = { val: cookieString };

    return _db.collection(COLLECTION_COOKIES).findOne(cookieQuery)
    .then(function(doc) {
        return doc != null;
    })
    .catch(function(error) {
        logger.debug("Error checking if user is logged in with cookie: " + error);
        return false;
    });
}

/*
async function getUserForCookie(cookieString) {
    var cookieQuery = { val: cookieString };

    var doc = await getUserAndIdForCookie(cookieString);

    if (doc != null) {
        return doc.username;
    }
    else {
        logger.debug("No such cookie is found.");
        return null;
    }

    // return _db.collection(COLLECTION_COOKIES).findOne(cookieQuery)
    // .then(function(doc) {
    //     if (doc != null) {
    //         return doc.username;
    //     }
    //     else {
    //         logger.debug("No such cookie is found.");
    //         return null;
    //     }
    // })
    // .catch(function(error) {
    //     logger.debug("Could not complete query to find username for cookie. Error: " + error);
    //     return null;
    // });
}
*/

/*
async function getIdForCookie(cookieString) {
    var cookieQuery = { val: cookieString };

    var doc = await getUserAndIdForCookie(cookieString);

    if (doc != null) {
        return doc.userId;
    }
    else {
        logger.debug("No such cookie is found.");
        return null;
    }

    // return _db.collection(COLLECTION_COOKIES).findOne(cookieQuery)
    // .then(function(doc) {
    //     if (doc != null) {
    //         return doc.userId;
    //     }
    //     else {
    //         logger.debug("No such cookie is found.");
    //         return null;
    //     }
    // })
    // .catch(function(error) {
    //     logger.debug("Could not complete query to find userId for cookie. Error: " + error);
    //     return null;
    // });
}
*/

function promiseWrapGet(cookieString, memcached) {
    return new Promise(function(resolve, reject) {
        memcached.get(cookieString, function(err, data) {
            if (err) {
                logger.debug("Error getting data from memcached: " + err);
                // reject(err);
            }

            if (data) {
                logger.debug("Cookie: " + cookieString + " was in memcached.");
                resolve({userId: data.userId, username: data.username});
            }
            else {
                resolve(null);
            }
        });
    });
}

function promiseWrapSet(cookieString, memcached) {
    var cookieQuery = { val: cookieString };

    return _db.collection(COLLECTION_COOKIES).findOne(cookieQuery).then(function(doc) {
        if (doc != null) {
            let memCookieObj = {userId: doc.userId, username: doc.username};
            memcached.set(cookieString, memCookieObj, 86400, function(err) {
                if (err) {
                    logger.debug("Error setting object in memcached: " + err);
                }
            });
            return memCookieObj;
            // resolve(memCookieObj);
        }
        else {
            logger.debug("No such cookie is found.");
            // resolve(null);
            return null;
        }
    });
}

async function getUserAndIdForCookie(cookieString) {
    // logger.debug("Get user and ID for cookie");
    if (cookieString == null) return null;
    var cookieQuery = { val: cookieString };

    var memcached = memcachedUtils.memcached;

    var data = await promiseWrapGet(cookieString, memcached);
    if (data != null) {
        return new Promise(function(resolve, reject) {
            resolve(data);
        });
    }
    
    // return new Promise(function(resolve, reject) {
    //     resolve(promiseWrapSet(cookieString, memcached));
    // });
    return promiseWrapSet(cookieString, memcached);

/*
    return new Promise(function(resolve, reject) {
        logger.debug("Outer promise");
        memcached.get(cookieString, function(err, data) {
            logger.debug("Inner Promise");
            if (err) {
                logger.debug("Error getting data from memcached: " + err);
                // reject(err);
            }

            if (data) {
                logger.debug("Cookie: " + cookieString + " was in memcached.");
                resolve({userId: data.userId, username: data.username});
            }
            else {
                logger.debug("Cookie: " + cookieString + " was not in memcached");
                
                _db.collection(COLLECTION_COOKIES).findOne(cookieQuery).then(function(doc) {

                    if (doc != null) {
                        let memCookieObj = {userId: doc.userId, username: doc.username};
                        memcached.set(cookieString, memCookieObj, 86400, function(err) {
                            if (err) {
                                logger.debug("Error setting object in memcached: " + err);
                            }
                        });
                        // return memCookieObj;
                        resolve(memCookieObj);
                    }
                    else {
                        logger.debug("No such cookie is found.");
                        resolve(null);
                        // return null;
                    }
                });
                

                // .catch(function(error) {
                //     logger.debug("Could not complete query to find userId for cookie. Error: " + error);
                //     // reject(error);
                // })
            }
        });
    });
*/

    // return _db.collection(COLLECTION_COOKIES).findOne(cookieQuery)
    // .then(function(doc) {
    //     if (doc != null) {
    //         return {userId: doc.userId, username: doc.username};
    //     }
    //     else {
    //         logger.debug("No such cookie is found.");
    //         return null;
    //     }
    // })
    // .catch(function(error) {
    //     logger.debug("Could not complete query to find userId for cookie. Error: " + error);
    //     return null;
    // });
}


module.exports = {
    connect: async function() {
        try {
            var db = await mongo.connect(url);
            _realdb = db;
            _db = db.db(DATABASE);
            logger.debug("CONNECTED");
        }
        catch (error) {
            logger.debug("Error connecting to MongoDB: " + error);
        }
    },
    getDB: function() {
        return _db;
    },
    getRealDB: function() {
        return _realdb;
    },
    getDbAsync: function() {
        if (_db == null) {
            return mongo.connect(url)
            .then(function(db) {
                _realdb = db;
                _db = db.db(DATABASE);
                logger.debug("Connected Async with MongoDB");
                return _db;
            })
            .catch(function(error) {
                logger.debug("Error connecting to MongoDB Async: " + error);
            });
        }
        else {
            return new Promise(function(resolve, reject) {
                resolve(_db);
            });
        }
    },
    checkIfUserLoggedIn: checkIfUserLoggedIn,
    // getUserForCookie: getUserForCookie,
    // getIdForCookie: getIdForCookie,
    getUserAndIdForCookie: getUserAndIdForCookie
};
