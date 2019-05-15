

// Must customize

const { Client } = require('@elastic/elasticsearch');
// const client = new Client({ node: 'http://localhost:9200' });
// const client = new Client({node: 'http://192.168.122.16:9200'}); // My ElasticSearch IP for now.
const client = new Client({
//     // nodes: [{: '192.168.122.16', port: 9200}, {host: '192.168.122.26', port: 9200}]
    // nodes: ['http://192.168.122.26:9200', 'http://192.168.122.27:9200']
    nodes: ['http://10.3.7.114:9200', 'http://10.3.7.115:9200', 'http://10.3.7.116:9200', 'http://10.3.7.117:9200']
});

module.exports = {
    getElasticClient: function() {
        return client;
    }
};
