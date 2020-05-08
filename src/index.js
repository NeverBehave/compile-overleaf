const process = require('./process');
const READ_ONLY_TOKEN_PATTERN = '([a-z]{12})';
const READ_ONLY_TOKEN_REGEX = new RegExp(`^${READ_ONLY_TOKEN_PATTERN}$`);

module.exports = async (token) => {
    if (READ_ONLY_TOKEN_REGEX.test(token)) {
        return process(token);
    } else {
        const err = new Error('invaild key');
        err.statusCode = 404;
        throw err;
    }
};
