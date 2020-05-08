const cache = require('memory-cache');

const getCSRF = (html) => {
    const csrfRegex = /window\.csrfToken = "(.*)";/
    return html.match(csrfRegex)[1]
}

const getCookieString = (cookies) => {
    return cookies.map(e => {
        return e.split(';')[0]
    }).join(';')
}

const CSRFKey = (key) => `csrf-${key}`
const cookieStringKey = (key) => `cookie-${key}`
const projectIdKey = (key) => `projectId-${key}`
const compiledResponseKey = (key) => `compiled-${key}`
const refererKey = (key) => `referer-${key}`

const getProjectId = (key) => cache.get(projectIdKey(key))

const CSRFData = (key) => {
        return { '_csrf': cache.get(CSRFKey(key))}
}

const buildHeader = (key) => {
    const Referer = cache.get(refererKey(key));
    return { 
            ...(Referer && { Referer }),
            'Content-Type': 'application/json;charset=utf-8',
            Origin: 'https://www.overleaf.com',
            Cookie: cache.get(cookieStringKey(key)),
    }
}

const parseHTMLRequest = async (key, response) => {  
  cache.put(cookieStringKey(key), getCookieString(response.headers['set-cookie']))
  if (typeof response.data === 'string')
    cache.put(CSRFKey(key), getCSRF(response.data))
  
  cache.put(refererKey(key), response.config.url)
}

module.exports = {
  CSRFKey,
  CSRFData,
  cookieStringKey,
  projectIdKey,
  compiledResponseKey,
  refererKey,
  buildHeader,
  parseHTMLRequest,
  getProjectId
};
