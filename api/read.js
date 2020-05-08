const cache = require('memory-cache');
const process = require('../process')
const utils = require('../request')

const READ_ONLY_TOKEN_PATTERN = '([a-z]{12})'
const READ_ONLY_TOKEN_REGEX = new RegExp(`^${READ_ONLY_TOKEN_PATTERN}$`)

module.exports = async (req, res) => {
    const { token } = req.query
    if (READ_ONLY_TOKEN_REGEX.test(token)){
        const previous_build = cache.get(utils.compiledResponseKey(token))
        if (!previous_build) {
            try {
                const compiled = await process(token)
                res.status(200).send(compiled)
            } catch (e) {
                res.status(500).send({
                    status: e.statusCode,
                    stage: e.message
                });
            }
        } else {
            res.status(200).send(previous_build)
        }
    } else {
        res.status(404).send({
            message: "token is invaild"
        })
    }
}