

const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();
const port = 3001;

app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/static"));
// app.use(cookieParser('cse356-cookie-secret'));
app.use(cookieParser());

app.set('trust proxy', true);

let constants = require('./Utils.js');
const STATUS_OK = constants.STATUS_OK;
const STATUS_ERROR = constants.STATUS_ERROR;


var mongoUtil = require('./MongoUtils.js');
var rabbitUtils = require('./RabbitmqUtils.js');

mongoUtil.connect();
rabbitUtils.connect();

require('./Login.js')(app);
require('./NewUser.js')(app);
require('./Questions.js')(app);
require('./Search.js')(app);
require('./ConfigureDatabase.js')(app);
// require('./MediaTest.js')(app);
require('./Users.js')(app);
require('./Media.js')(app);
require('./Upvote.js')(app);

app.post('/CheckLoginStatus', async function(req, res) {
    // just sends cookie
    var cookie = req.cookies['SessionID'];
    
    if (cookie != undefined) {
        var isLoggedIn = await mongoUtil.checkIfUserLoggedIn(cookie);
        if (isLoggedIn) {
            res.json({ loggedIn: true });
            return;
        }
    }
    res.json({ loggedIn: false });
});

app.listen(port, function() {
});

// Math.floor(Date.now() / 1000);
