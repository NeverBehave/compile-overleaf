const cache = require('node-cache');
const apiCache = new cache({ stdTTL: 600 });
const process = require('../src/index');

module.exports = async (req, res) => {
    const { token = '' } = req.query;
    const previous_build = apiCache.get(token);
    if (!previous_build) {
        try {
            const compiled = await process(token);
            apiCache.set(`${token}`, compiled);
            res.status(200).send(compiled);
        } catch (e) {
            res.status(200).send({
                status: e.statusCode,
                stage: e.message,
            });
        }
    } else {
        res.status(200).send(previous_build);
    }
};
