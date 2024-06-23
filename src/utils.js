const cache = require('./cache').cache;
const { cookieStringKey, projectIdKey, refererKey, CSRFKey } = require('./cache').keys;

const defaultHeader = () => {
    return {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/114.0',
        Origin: 'https://www.overleaf.com',
    };
};

const getCSRF = (html) => {
    const csrfRegex = /<meta name="ol-csrfToken" content="(.*?)">/;
    return html.match(csrfRegex)[1];
};

const getProjectTitle = (html) => {
    const titleRegex = /<meta name="og:title" content="(.*?)">/;
    return html.match(titleRegex)[1];
};

const getCookieString = (cookies) => {
    return cookies
        .map((e) => {
            return e.split(';')[0];
        })
        .join(';');
};

const getProjectId = (key) => cache.get(projectIdKey(key));

const CSRFData = (key) => {
    return { _csrf: cache.get(CSRFKey(key)) };
};

// @TODO just a dead simple mock, not sure if it is necessary
const buildHeader = (key) => {
    const Referer = cache.get(refererKey(key));
    return {
        ...(Referer && { Referer }),
        ...defaultHeader(),
        Cookie: cache.get(cookieStringKey(key)),
    };
};

const setLatestCookie = (key, response) => {
    const cookieString = getCookieString(response.headers['set-cookie']);
    cache.set(cookieStringKey(key), cookieString);
};

const parseHTMLRequest = async (key, response) => {
    setLatestCookie(key, response);
    if (typeof response.data === 'string') cache.set(CSRFKey(key), getCSRF(response.data));

    cache.set(refererKey(key), response.config.url);
};

module.exports = {
    CSRFData,
    defaultHeader,
    buildHeader,
    parseHTMLRequest,
    setLatestCookie,
    getProjectId,
    getProjectTitle,
};
