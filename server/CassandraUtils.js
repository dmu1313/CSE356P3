
const cassandra = require('cassandra-driver');

var cassandraKeyspace = "final";
var cassandraTable = "imgs";
var cassandraFullName = cassandraKeyspace + "." + cassandraTable;

const client = new cassandra.Client({
    contactPoints: ['127.0.0.1:9042', '192.168.122.17'],
    localDataCenter: 'test_dc'
    // keyspace: cassandraKeyspace
});

client.connect(function(err) {
    if (err) {
        console.log("Cassandra: Error connecting: " + err);
        return;
    }
    console.log("Connected to Cassandra cluster.");
});

module.exports = {
    cassandraKeyspace: cassandraKeyspace,
    cassandraTable: cassandraTable,
    cassandraFullName: cassandraFullName,
    getCassandraClient: function() {
        return client;
    }
};
