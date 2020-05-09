const axios = require('axios');
const cache = require('./cache').cache;
const { projectTitleKey, projectIdKey } = require('./cache').keys;
const utils = require('./utils');
const base = 'https://www.overleaf.com';
const url = (token) => `${base}/read/${token}`;
const grantUrl = (token) => `${url(token)}/grant`;
const projectUrl = (projectId) => `${base}/project/${projectId}`;
const compileUrl = (projectId) => `${projectUrl(projectId)}/compile?auto_compile=true`;

const errorHandler = (e, message) => {
    const err = new Error(message);
    err.statusCode = e.response.status;
    throw err;
};

const readContent = async (token) =>
    axios({
        method: 'get',
        url: url(token),
    })
        .then((res) => {
            utils.parseHTMLRequest(token, res);
        })
        .catch((e) => {
            errorHandler(e, 'reading');
        });

const grantContent = async (token) =>
    axios({
        url: grantUrl(token),
        method: 'post',
        headers: utils.buildHeader(token),
        data: utils.CSRFData(token),
    }).catch((e) => {
        errorHandler(e, 'granting permission');
    });

const projectContent = async (token) => {
    return axios({
        method: 'get',
        url: projectUrl(utils.getProjectId(token)),
        headers: utils.buildHeader(token),
    })
        .then((res) => {
            utils.parseHTMLRequest(token, res);
            const title = utils.getProjectTitle(res.data);
            title && cache.set(projectTitleKey(token), title);
        })
        .catch((e) => {
            errorHandler(e, 'loading project');
        });
};

/**
 * {"status":"success","outputFiles":
 * [{"path":"output.fdb_latexmk","url":"/project/5bb6c231bc1bd011575f8ac6/build/171f61930a5-5a7755e0b17e20cb/output/output.fdb_latexmk","type":"fdb_latexmk","build":"171f61930a5-5a7755e0b17e20cb"},
 * {"path":"output.aux","url":"/project/5bb6c231bc1bd011575f8ac6/build/171f61930a5-5a7755e0b17e20cb/output/output.aux","type":"aux","build":"171f61930a5-5a7755e0b17e20cb"},
 * {"path":"output.fls","url":"/project/5bb6c231bc1bd011575f8ac6/build/171f61930a5-5a7755e0b17e20cb/output/output.fls","type":"fls","build":"171f61930a5-5a7755e0b17e20cb"},
 * {"path":"output.pdf","url":"/project/5bb6c231bc1bd011575f8ac6/build/171f61930a5-5a7755e0b17e20cb/output/output.pdf","type":"pdf","build":"171f61930a5-5a7755e0b17e20cb"},
 * {"path":"output.log","url":"/project/5bb6c231bc1bd011575f8ac6/build/171f61930a5-5a7755e0b17e20cb/output/output.log","type":"log","build":"171f61930a5-5a7755e0b17e20cb"},
 * {"path":"output.chktex","url":"/project/5bb6c231bc1bd011575f8ac6/build/171f61930a5-5a7755e0b17e20cb/output/output.chktex","type":"chktex","build":"171f61930a5-5a7755e0b17e20cb"},
 * {"path":"output.synctex.gz","url":"/project/5bb6c231bc1bd011575f8ac6/build/171f61930a5-5a7755e0b17e20cb/output/output.synctex.gz","type":"gz","build":"171f61930a5-5a7755e0b17e20cb"},
 * {"path":"output.out","url":"/project/5bb6c231bc1bd011575f8ac6/build/171f61930a5-5a7755e0b17e20cb/output/output.out","type":"out","build":"171f61930a5-5a7755e0b17e20cb"}],
 * "compileGroup":"standard","clsiServerId":"clsi-pre-emp-e2-a-wpzl","pdfDownloadDomain":"https://compiles.overleaf.com"}
 * @param {String} token
 */
const compileContent = async (token) => {
    return axios({
        method: 'post',
        url: compileUrl(utils.getProjectId(token)),
        headers: utils.buildHeader(token),
        data: {
            ...utils.CSRFData(token),
            rootDoc_id: null,
            draft: false,
            check: 'silent',
            incrementalCompilesEnabled: false,
        },
    }).catch((e) => {
        errorHandler(e, 'compling project');
    });
};

// https://compiles.overleaf.com/project/5bb6c231bc1bd011575f8ac6
// /user/5983d37d041afc100f20761c ? optional
// /build/171f620ef1b-de3e67d3e3ce47ec/output/output.pdf
// ?compileGroup=standard&clsiserverid=clsi-pre-emp-e2-a-wpzl&pdfng=true
const compilePDFUrl = async (content) => {
    const extracted = {};
    if (content.status === 'success') {
        content.outputFiles.forEach((e) => {
            extracted[e.type] = `${content.pdfDownloadDomain}${e.url}?compileGroup=${content.compileGroup}&clsiserverid=${content.clsiServerId}`;
        });
    }

    return extracted;
};

const buildProcess = async (token) => {
    try {
        await readContent(token);
        const grant = await grantContent(token);
        cache.set(projectIdKey(token), grant.data.redirect.slice(9));
        await projectContent(token);
        const compile = await compileContent(token);
        const compileObj = {
            name: cache.get(projectTitleKey(token)),
            link: await compilePDFUrl(compile.data),
        };
        return compileObj;
    } catch (e) {
        throw e;
    }
};

module.exports = buildProcess;
