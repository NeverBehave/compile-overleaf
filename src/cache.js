const NodeCache = require('node-cache');
const myCache = new NodeCache({ stdTTL: 1200 });

module.exports = myCache;
