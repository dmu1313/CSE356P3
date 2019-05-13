
var Memcached = require('memcached');
var memcached = new Memcached('192.168.122.23:11211', {timeout: 100, retries: 0});

module.exports = {
    memcached: memcached
};