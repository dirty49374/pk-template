"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const underscore_1 = __importDefault(require("underscore"));
const fs_1 = __importDefault(require("fs"));
const url_1 = __importDefault(require("url"));
const glob_1 = __importDefault(require("glob"));
const sync_request_1 = __importDefault(require("sync-request"));
const utils = __importStar(require("./utils"));
const yamls = __importStar(require("./yamls"));
underscore_1.default.templateSettings = {
    interpolate: /\<\<\<\=(.+?)\>\>\>/g,
    evaluate: /\<\<\<\_(.+?)\>\>\>/g,
};
function isHttp(uri) {
    const supportedProtocols = ['http:', 'https:'];
    const parsed = url_1.default.parse(uri);
    return supportedProtocols.some(protocol => protocol == parsed.protocol);
}
exports.isHttp = isHttp;
function loadText(scope, uri) {
    try {
        return isHttp(uri)
            ? sync_request_1.default('GET', uri).getBody('utf8')
            : fs_1.default.readFileSync(uri, 'utf8');
    }
    catch (e) {
        throw utils.pktError(scope, e, `failed to load ${uri}`);
    }
}
exports.loadText = loadText;
function yaml(scope, uri) {
    const str = loadText(scope, uri);
    try {
        return yamls.load(str);
    }
    catch (e) {
        throw utils.pktError(scope, e, `failed to parse yaml ${uri}`);
    }
}
exports.yaml = yaml;
function yamlAll(scope, uri) {
    const str = loadText(scope, uri);
    try {
        return yamls.loadAll(str);
    }
    catch (e) {
        throw utils.pktError(scope, e, `failed to parse yaml ${uri}`);
    }
}
exports.yamlAll = yamlAll;
function pkt(scope, uri) {
    const str = loadText(scope, uri);
    try {
        return yamls.loadAsPkt(str);
    }
    catch (e) {
        throw utils.pktError(scope, e, `failed to parse yaml ${uri}`);
    }
}
exports.pkt = pkt;
function template(scope, uri) {
    const str = loadText(scope, uri);
    try {
        return underscore_1.default.template(str);
    }
    catch (e) {
        throw utils.pktError(scope, e, `failed to parse template ${uri}`);
    }
}
exports.template = template;
function files(scope, uri) {
    if (isHttp(uri)) {
        throw new Error(`cannot get directory listing from ${uri}`);
    }
    return fs_1.default.readdirSync(uri);
}
exports.files = files;
function globs(scope, uri) {
    if (isHttp(uri)) {
        throw new Error(`cannot get directory listing from ${uri}`);
    }
    const list = glob_1.default.sync(uri);
    return list;
}
exports.globs = globs;
function xx() {
    console.log('xxxxx');
}
exports.xx = xx;
