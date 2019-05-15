
var loggerUtils = require('./LoggerUtils.js');
var logger = loggerUtils.getAppLogger();
const cassandra = require('cassandra-driver');

var cassandraKeyspace = "final";
var cassandraTable = "imgs";
var cassandraFullName = cassandraKeyspace + "." + cassandraTable;

const client = new cassandra.Client({
    contactPoints: ['10.3.7.107', '10.3.7.108', '10.3.7.110'],
    // contactPoints: ['192.168.122.37', '192.168.122.31'],
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
