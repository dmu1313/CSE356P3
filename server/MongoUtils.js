
var mongo = require('mongodb').MongoClient;
const url = "mongodb://192.168.122.13:27017";

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
        console.log("Error checking if user is logged in with cookie: " + error);
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
        console.log("No such cookie is found.");
        return null;
    }

    // return _db.collection(COLLECTION_COOKIES).findOne(cookieQuery)
    // .then(function(doc) {
    //     if (doc != null) {
    //         return doc.username;
    //     }
    //     else {
    //         console.log("No such cookie is found.");
    //         return null;
    //     }
    // })
    // .catch(function(error) {
    //     console.log("Could not complete query to find username for cookie. Error: " + error);
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
        console.log("No such cookie is found.");
        return null;
    }

    // return _db.collection(COLLECTION_COOKIES).findOne(cookieQuery)
    // .then(function(doc) {
    //     if (doc != null) {
    //         return doc.userId;
    //     }
    //     else {
    //         console.log("No such cookie is found.");
    //         return null;
    //     }
    // })
    // .catch(function(error) {
    //     console.log("Could not complete query to find userId for cookie. Error: " + error);
    //     return null;
    // });
}
*/

function getUserAndIdForCookie(cookieString) {
    if (cookieString == null) return null;
    var cookieQuery = { val: cookieString };

    var memcached = memcachedUtils.memcached;

    return new Promise(function(resolve, reject) {
        memcached.get(cookieString, function(err, data) {
            if (err) {
                console.log("Error getting data from memcached: " + err);
                return;
            }

            if (data) {
                console.log("Cookie: " + cookieString + " was in memcached.");
                resolve({userId: data.userId, username: data.username});
            }
            else {
                console.log("Cookie: " + cookieString + " was not in memcached");
                return _db.collection(COLLECTION_COOKIES).findOne(cookieQuery)
                .then(function(doc) {
                    if (doc != null) {
                        let memCookieObj = {userId: doc.userId, username: doc.username};
                        memcached.set(cookieString, memCookieObj, 86400, function(err) {
                            if (err) {
                                console.log("Error setting object in memcached: " + err);
                            }
                        });
                        resolve(memCookieObj);
                    }
                    else {
                        console.log("No such cookie is found.");
                        resolve(null);
                    }
                })
                .catch(function(error) {
                    console.log("Could not complete query to find userId for cookie. Error: " + error);
                    reject(error);
                });
            }
        });
    });

    // return _db.collection(COLLECTION_COOKIES).findOne(cookieQuery)
    // .then(function(doc) {
    //     if (doc != null) {
    //         return {userId: doc.userId, username: doc.username};
    //     }
    //     else {
    //         console.log("No such cookie is found.");
    //         return null;
    //     }
    // })
    // .catch(function(error) {
    //     console.log("Could not complete query to find userId for cookie. Error: " + error);
    //     return null;
    // });
}


module.exports = {
    connect: async function() {
        try {
            var db = await mongo.connect(url);
            _realdb = db;
            _db = db.db(DATABASE);
            console.log("CONNECTED");
        }
        catch (error) {
            console.log("Error connecting to MongoDB: " + error);
        }
    },
    getDB: function() {
        return _db;
    },
    getRealDB: function() {
        return _realdb;
    },
    checkIfUserLoggedIn: checkIfUserLoggedIn,
    // getUserForCookie: getUserForCookie,
    // getIdForCookie: getIdForCookie,
    getUserAndIdForCookie: getUserAndIdForCookie
};
