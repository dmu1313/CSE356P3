
function getRandomIdString() {
    return (Date.now()-1555000000000) + (Math.floor(Math.random() * 1000000) + 1).toString();
    // return (Math.floor(Math.random() * 1000000000000) + 1).toString();
}

function getUnixTime() {
    return Math.floor(Date.now() / 1000);
}

module.exports = {
    STATUS_OK: {status: "OK"},
    STATUS_ERROR: {status: "error"},
    DATABASE: "Final",

    COLLECTION_USERS: "Users",
    COLLECTION_COOKIES: "Cookies",
    COLLECTION_QUESTIONS: "Questions",
    COLLECTION_ANSWERS: "Answers",
    COLLECTION_IP_VIEWS: "Ip_Views",
    COLLECTION_USER_VIEWS: "User_Views",
    COLLECTION_MEDIA_TEST: "Media_Test",
    COLLECTION_ANSWER_UPVOTE: "A_upvote",
    COLLECTION_QUESTION_UPVOTE: "Q_upvote",
    COLLECTION_QMEDIA: "QMEDIA",
    COLLECTION_AMEDIA: "AMEDIA",
    COLLECTION_MEDIA: "MEDIA",
    

    getRandomIdString: getRandomIdString,
    getUnixTime: getUnixTime

};

