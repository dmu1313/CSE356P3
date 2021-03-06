
/*

Keywords to search for in logs.

Successes:
----------
Failed
Unable
not


Failures:
-----------
Got

*/

const log4js = require('log4js');
log4js.configure({
    appenders: {
        appLog: { type: 'file', filename: 'app.txt' },
        writeLog: { type: 'file', filename: 'Write.txt' },
        elasticWriteLog: { type: 'file', filename: 'ElasticWrite.txt' }
    },
    categories: {
        app: { appenders: ['appLog'], level: 'debug' },
        write: { appenders: ['writeLog'], level: 'debug' },
        elasticWrite: { appenders: ['elasticWriteLog'], level: 'debug' },
        default: { appenders: ['appLog'], level: 'debug' }
    }
});

// const logger = log4js.getLogger('app');
// logger.debug("This is a test.");

module.exports = {
    getAppLogger: function() {
        return log4js.getLogger('app');
    },
    getWriteLogger: function() {
        return log4js.getLogger('write');
    },
    getElasticWriteLogger: function() {
        return log4js.getLogger('elasticWrite');
    }
};


