
function getRandomIdString() {
    return (Math.floor(Math.random() * 1000000000000) + 1).toString();
}

function getUnixTime() {
    return Math.floor(Date.now() / 1000);
}

module.exports = {
    STATUS_OK: {"status": "OK"},
    STATUS_ERROR: {"status": "error"},
    DATABASE: "Final",

    COLLECTION_USERS: "Users",
    COLLECTION_COOKIES: "Cookies",
    COLLECTION_QUESTIONS: "Questions",
    COLLECTION_ANSWERS: "Answers",
    COLLECTION_IP_VIEWS: "Ip_Views",
    COLLECTION_USER_VIEWS: "User_Views",

    getRandomIdString: getRandomIdString,
    getUnixTime: getUnixTime

};

