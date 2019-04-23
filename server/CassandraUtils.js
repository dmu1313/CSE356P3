
var loggerUtils = require('./LoggerUtils.js');
var logger = loggerUtils.getAppLogger();
const cassandra = require('cassandra-driver');

var cassandraKeyspace = "final";
var cassandraTable = "imgs";
var cassandraFullName = cassandraKeyspace + "." + cassandraTable;

const client = new cassandra.Client({
    contactPoints: ['192.168.122.14', '192.168.122.17'],
    localDataCenter: 'test_dc'
    // keyspace: cassandraKeyspace
});

client.connect(function(err) {
    if (err) {
        logger.debug("Cassandra: Error connecting: " + err);
        return;
    }
    logger.debug("Connected to Cassandra cluster.");
});

module.exports = {
    cassandraKeyspace: cassandraKeyspace,
    cassandraTable: cassandraTable,
    cassandraFullName: cassandraFullName,
    getCassandraClient: function() {
        return client;
    }
};
