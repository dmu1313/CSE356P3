
/*
 * The purpose of this file is to allow for random testing of 3rd party API drivers such as MongoDB's Node Driver.
 * The values returned by certain functions aren't completely accurate in the documentation provided online by
 * 3rd parties.
 * 
 */

const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/static"));

const util = require('util');
var mongoUtil = require('./MongoUtils.js');
const fs = require('fs');

/*
function generateFilename() {
    var key = "", possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < 16; i++) {
        key += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return key;
}

mongoUtil.connect();

var file;
var numIO = 50;
var names = new Array(numIO);

// '/var/www/small_image.jpg'
var path = "C:\\Users\\Mu\\Desktop\\Dan's School Files Stony Brook\\Year 3\\Semester 2\\CSE 356\\Final Project\\CSE356P3\\server\\large_image.jpg";
fs.readFile(path, (err, data) => {
    if (err) {
        console.log("Error: " + err);
        return;
    }
    else {
        console.log("Read file.");
        file = data;
    }
});

var COLLECTION_MEDIA_TEST = 'MEDIA_TEST';

app.get('/deposit', function(req, res) {
    var db = mongoUtil.getDB();

    for (var i = 0; i < numIO; i++) {
        let filename = i + ": " + generateFilename();
        names[i] = filename;

        let query = {_id: filename, img: file};

        db.collection(COLLECTION_MEDIA_TEST).insertOne(query)
        .then(function(ret) {
            console.log("Inserted: " + filename);
        })
        .catch(function(error) {
            console.log("Failed to insert: " + filename + ", Error: " + error);
        });
        // console.log(util.inspect(ret, {showHidden: false, depth: 4}));
    }
    res.json({status: "OK"});
});

app.get('/retrieve', function(req, res) {
    var db = mongoUtil.getDB();

    for (var i = 0; i < numIO; i++) {
        let filename = names[i];

        let query = {_id: filename};

        db.collection(COLLECTION_MEDIA_TEST).findOne(query)
        .then(function(ret) {
            console.log("Got: " + filename);
        })
        .catch(function(error) {
            console.log("Failed to get: " + filename + ", Error: " + error);
        });
    }
    res.json({status: "OK"});
});

app.get('/Configure', function(req, res) {
    res.json({status: "OK"});
});

app.listen(port, function() {
});
*/




var COLLECTION_TEST = "TEST";

async function run() {
    await mongoUtil.connect();
    var db = mongoUtil.getDB();
    var randomId = (Math.floor(Math.random() * 1000000) + 1).toString();

    console.log("STARTING INSERT TEST");
    var insertTestQuery = {_id: randomId, value: "something"};
    let ret = await db.collection(COLLECTION_TEST).insertOne(insertTestQuery);
    console.log(util.inspect(ret, {showHidden: false, depth: 4}));
    // ret.result = { n: 1, ok: 1 },

    // .then (function(result) {
    //     console.log(util.inspect(result, {showHidden: false, depth: 4}));
    // })
    // .catch(function(error) { 
    //     console.log("Insert error: " + error);
    // });

    console.log("STARTING findOne TEST");
    var testQuery = { _id: randomId };
    ret = await db.collection(COLLECTION_TEST).findOne(testQuery);
    console.log(util.inspect(ret, {showHidden: false, depth: 4}));
    // ret = { _id: '306729', value: 'something' }

    // .then(function(doc) {
    //     console.log(util.inspect(doc, {showHidden: false, depth: 4}));
    // })
    // .catch(function(error) {
    //     console.log("findOne test failed: " + error);
    // });

    console.log("STARTING updateOne TEST");
    var updateQuery = {$set: {value: "hi"}};
    ret = await db.collection(COLLECTION_TEST).updateOne(testQuery, updateQuery);
    console.log(util.inspect(ret, {showHidden: false, depth: 4}));
    // ret.result = { n: 1, nModified: 1, ok: 1 }

    console.log("STARTING findOne TEST (to verify update)");
    ret = await db.collection(COLLECTION_TEST).findOne(testQuery);
    console.log(util.inspect(ret, {showHidden: false, depth: 4}));
    // ret= { _id: '306729', value: 'hi' }


    var arr = [];
    for (let i = 0; i < 5; i++) {
        arr.push({_id: i.toString(), num: i.toString()});
    } 

    var res = await db.collection(COLLECTION_TEST).insertMany(arr);
    console.log(res);

    var media = ["1", "2", "3"];
    let mediaIdQuery = {_id: {$in: media} };
    res = await db.collection(COLLECTION_TEST).findOne(mediaIdQuery);
    if (res == null) {
        console.log("NULL");
    }
    else {
        console.log("id: " + res._id);
        console.log("num: " + res.num);
    }

    res = await db.collection(COLLECTION_TEST).deleteMany({});
    // console.log(res);


    db.collection(COLLECTION_TEST).createIndexes([
        { key: {userId: 1}, unique: true },
        { key: {username: 1}, unique: true },
        { key: {email: 1}, unique: true }
    ])
    .then(function(result) {
    console.log("createIndexes: " + result);
    })
    .catch(function(error) {
    console.log("createIndexes: " + error);
    });

    db.collection(COLLECTION_TEST).createIndex( { val: 1 }, {unique: true} )
    .then(function(result) {
        console.log("createIndex: " + result);
    })
    .catch(function(error) {
        console.log(" createIndex: " + error);
    });


    

// let deleteQuery = { questionId: qid, userId: userId };
// let ret = await db.collection(COLLECTION_QUESTIONS).deleteOne(deleteQuery);
// let result = ret.result;
// console.log("Deleted question: n=" + result.n + ", ok=" + result.ok);

// if (result.n != 1 || result.ok != 1) {
//     res.status(401).json({status: "error", error: errorMessage})
// }
// else {
//     res.status(200).json({status: "OK"});

}

run();
