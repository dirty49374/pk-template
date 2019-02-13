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
const loaders = {
    isHttp(uri) {
        const supportedProtocols = ['http:', 'https:'];
        const parsed = url_1.default.parse(uri);
        return supportedProtocols.some(protocol => protocol == parsed.protocol);
    },
    text(scope, uri) {
        try {
            return loaders.isHttp(uri)
                ? sync_request_1.default('GET', uri).getBody('utf8')
                : fs_1.default.readFileSync(uri, 'utf8');
        }
        catch (e) {
            throw utils.pktError(scope, e, `failed to load ${uri}`);
        }
    },
    yaml(scope, uri) {
        const text = loaders.text(scope, uri);
        try {
            return yamls.load(text);
        }
        catch (e) {
            throw utils.pktError(scope, e, `failed to parse yaml ${uri}`);
        }
    },
    yamlAll(scope, uri) {
        const text = loaders.text(scope, uri);
        try {
            return yamls.loadAll(text);
        }
        catch (e) {
            throw utils.pktError(scope, e, `failed to parse yaml ${uri}`);
        }
    },
    pkt(scope, uri) {
        const text = loaders.text(scope, uri);
        try {
            return yamls.loadAsPkt(text);
        }
        catch (e) {
            throw utils.pktError(scope, e, `failed to parse yaml ${uri}`);
        }
    },
    template(scope, uri) {
        const text = loaders.text(scope, uri);
        try {
            return underscore_1.default.template(text);
        }
        catch (e) {
            throw utils.pktError(scope, e, `failed to parse template ${uri}`);
        }
    },
    files(scope, uri) {
        if (loaders.isHttp(uri)) {
            throw new Error(`cannot get directory listing from ${uri}`);
        }
        return fs_1.default.readdirSync(uri);
    },
    globs(scope, uri) {
        if (loaders.isHttp(uri)) {
            throw new Error(`cannot get directory listing from ${uri}`);
        }
        const list = glob_1.default.sync(uri);
        return list;
    },
};
exports.default = loaders;
