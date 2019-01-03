const _ = require('underscore');
const fs = require("fs");
const url = require('url');
const glob = require('glob');
const syncRequest = require('sync-request');

const utils = require('./utils');
const yamls = require('./yamls');


_.templateSettings = {
    interpolate: /\<\<\<\=(.+?)\>\>\>/g,
    evaluate: /\<\<\<\_(.+?)\>\>\>/g,
};

const loaders = {
    isHttp(uri) {
        const supportedProtocols = [ 'http:', 'https:' ];
        const parsed = url.parse(uri);
        return supportedProtocols.some(protocol => protocol == parsed.protocol);
    },
    text(scope, uri) {
        try {
            return loaders.isHttp(uri)
                ? syncRequest('GET', uri).getBody('utf8')
                : fs.readFileSync(uri, 'utf8');
        } catch (e) {
            throw utils.pktError(scope, e, `failed to load ${uri}`);
        }
    },
    yaml(scope, uri) {
        const text = loaders.text(scope, uri);
        try {
            return yamls.load(text);
        } catch (e) {
            throw utils.pktError(scope, e, `failed to parse yaml ${uri}`);
        }
    },
    yamlAll(scope, uri) {
        const text = loaders.text(scope, uri);
        try {
            return yamls.loadAll(text);
        } catch (e) {
            throw utils.pktError(scope, e, `failed to parse yaml ${uri}`);
        }
    },
    pkt(scope, uri) {
        const text = loaders.text(scope, uri);
        try {
            return yamls.loadAsPkt(text);
        } catch (e) {
            throw utils.pktError(scope, e, `failed to parse yaml ${uri}`);
        }
    },
    template(scope, uri) {
        const text = loaders.text(scope, uri);
        try {
            return _.template(text);
        } catch (e) {
            throw utils.pktError(scope, e, `failed to parse template ${uri}`);
        }
    },
    files(scope, uri) {
        if (loaders.isHttp(uri)) {
            throw new Error(`cannot get directory listing from ${uri}`);
        }

        return fs.readdirSync(uri);
    },
    globs(scope, uri) {
        if (loaders.isHttp(uri)) {
            throw new Error(`cannot get directory listing from ${uri}`);
        }

        const list = glob.sync(uri);
        return list;
    },
}

module.exports = loaders;
