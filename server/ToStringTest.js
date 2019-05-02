

const loggerUtils = require('./LoggerUtils.js');
const logger = loggerUtils.getAppLogger('app');

class Upvote {
    constructor(userId, qid, val, waived) {
        this.userId = userId;
        this.qid = qid;
        this.val = val;
        this.waived = waived;
    }
    toString() {
        return "userId: " + this.userId + ", questionId: " + this.qid + ", val: " + this.val + ", waived: " + this.waived;
    }
}

var insertUpvoteQuery1 = new Upvote('123', '1', true, false);
var insertUpvoteQuery2 = new Upvote('123', '2', false, true);
var insertUpvoteQuery3 = new Upvote('124', '3', false, false);

console.log(insertUpvoteQuery1.toString());
console.log(insertUpvoteQuery2.toString());
console.log(insertUpvoteQuery3.toString());

logger.debug(insertUpvoteQuery1);
logger.debug(insertUpvoteQuery2);
logger.debug(insertUpvoteQuery3);

