

const express = require('express');
const cookieParser = require('cookie-parser');
const mongo = require('mongodb').MongoClient;
const url = "mongodb://localhost:27017";

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/static"));
// app.use(cookieParser('cse356-cookie-secret'));
app.use(cookieParser());

let constants = require('./Utils.js');
const STATUS_OK = constants.STATUS_OK;
const STATUS_ERROR = constants.STATUS_ERROR;
const DATABASE = constants.DATABASE;
// const COLLECTION_USERS = "Users";
// const COLLECTION_COOKIES = "Cookies";
// const COLLECTION_GAMES = "Games";


app.post('/adduser/', function (req, res) {

    res.json(STATUS_OK);
});

