
var Memcached = require('memcached');
var memcached = new Memcached('192.168.122.20:11211');

module.exports = {
    memcached: memcached
};