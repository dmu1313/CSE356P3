
const log4js = require('log4js');
log4js.configure({
    appenders: {
        appLog: { type: 'file', filename: 'app.log' },
        writeLog: { type: 'file', filename: 'Write.txt' }
    },
    categories: {
        app: { appenders: ['appLog'], level: 'debug' },
        write: { appenders: ['writeLog'], level: 'debug' },
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
    }
};
