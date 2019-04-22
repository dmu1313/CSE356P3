

// Must customize

const { Client } = require('@elastic/elasticsearch');
// const client = new Client({ node: 'http://localhost:9200' });
// const client = new Client({node: 'http://192.168.122.16:9200'}); // My ElasticSearch IP for now.
const client = new Client({
    hosts: ['http://192.168.122.16:9200', 'http://192.168.122.xx:9200', 'http://192.168.122.xx:9200']
});

module.exports = {
    getElasticClient: function() {
        return client;
    }
};
