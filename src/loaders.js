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
    resolve(scope, path, fromCwd) {
        if (fromCwd) {
            return path;
        }
        const p1 = scope ? scope.config.resolve(path) : path; // resolve @
        const resolved = url.resolve(scope.uri, p1);
        return resolved || '.';
    },
    isHttp(uri) {
        const supportedProtocols = [ 'http:', 'https:' ];
        const parsed = url.parse(uri);
        return supportedProtocols.some(protocol => protocol == parsed.protocol);
    },
    text(scope, uri, fromCwd) {
        try {
            uri = loaders.resolve(scope, uri, fromCwd);

            return loaders.isHttp(uri)
                ? syncRequest('GET', uri).getBody('utf8')
                : fs.readFileSync(uri, 'utf8');
        } catch (e) {
            throw utils.pktError(scope, e, `failed to load ${uri}`);
        }
    },
    yaml(scope, uri, fromCwd) {
        const text = loaders.text(scope, uri, fromCwd);
        try {
            return yamls.loadAsPkt(text);
        } catch (e) {
            throw utils.pktError(scope, e, `failed to parse yaml ${uri}`);
        }
    },
    template(scope, uri, fromCwd) {
        const text = loaders.text(scope, uri, fromCwd);
        try {
            return _.template(text);
        } catch (e) {
            throw utils.pktError(scope, e, `failed to parse template ${uri}`);
        }
    },
    files(scope, path, fromCwd) {
        const uri = loaders.resolve(scope, path, fromCwd);
        if (loaders.isHttp(uri)) {
            throw new Error(`cannot get directory listing from ${uri}`);
        }

        return fs.readdirSync(uri);
    },
    globs(scope, path, fromCwd) {
        const uri = loaders.resolve(scope, path, fromCwd);
        if (loaders.isHttp(uri)) {
            throw new Error(`cannot get directory listing from ${uri}`);
        }

        const list = glob.sync(uri);
        return list;
    },
}

module.exports = loaders;
