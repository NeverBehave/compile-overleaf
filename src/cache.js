const NodeCache = require('node-cache');
const myCache = new NodeCache({ stdTTL: 1200 });

const CSRFKey = (key) => `csrf-${key}`;
const cookieStringKey = (key) => `cookie-${key}`;
const projectIdKey = (key) => `projectId-${key}`;
const compiledResponseKey = (key) => `compiled-${key}`;
const refererKey = (key) => `referer-${key}`;
const projectTitleKey = (key) => `title-${key}`;

module.exports = {
    cache: myCache,
    keys: {
        cookieStringKey,
        projectIdKey,
        compiledResponseKey,
        refererKey,
        CSRFKey,
        projectTitleKey,
    },
};
