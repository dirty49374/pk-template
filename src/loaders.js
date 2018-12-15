const _ = require('underscore');
const fs = require("fs");
const url = require('url');
const jsyaml = require('js-yaml');
const syncRequest = require('sync-request');
const coffeeScript = require('coffeescript');
const liveScript = require('livescript');

const base = require('./base');


_.templateSettings = {
    interpolate: /\<\<\<\=(.+?)\>\>\>/g,
    evaluate: /\<\<\<\_(.+?)\>\>\>/g,
};

const createCustomTag = (name, compile) => {
    return new jsyaml.Type(`!${name}`, {
        kind: 'scalar',
        resolve: data =>
                typeof data === 'string' ||
                typeof data === number ||
                typeof data === null,
        construct: data => new base.JavaScriptCode(compile ? compile(data) : data),
        instanceOf: base.JavaScriptCode,
        represent: jsCode => `!${name} ${jsCode.code}`
    });
}

const PKT_SCHEMA = jsyaml.Schema.create([
    createCustomTag('cs', data => coffeeScript.compile(data, { bare: true })),
    createCustomTag('coffeeScript', data => coffeeScript.compile(data, { bare: true })),
    createCustomTag('ls', data => liveScript.compile(data, { bare: true })),
    createCustomTag('liveScript', data => liveScript.compile(data, { bare: true })),
    createCustomTag('js', data => data),
    createCustomTag('javaScript', data => data),
]);

const pktYamlOption = { schema: PKT_SCHEMA };

const load = {
    text(scope, uri) {
        try {
            uri = scope ? scope.config.resolve(uri) : uri; // resolve @
            let parsed = url.parse(uri);

            const supportedProtocols = [ 'http:', 'https:' ];
            const isAbsoluteUrl = supportedProtocols.some(protocol => protocol == parsed.protocol);

            return isAbsoluteUrl
                ? syncRequest('GET', uri).getBody('utf8')
                : fs.readFileSync(uri, 'utf8');
        } catch (e) {
            throw base.pktError(scope, e, `failed to load ${uri}`);
        }
    },
    yaml(scope, uri) {
        const text = load.text(scope, uri);
        try {
            return jsyaml.load(text, pktYamlOption);
        } catch (e) {
            throw base.pktError(scope, e, `failed to parse yaml ${uri}`);
        }
    },
    yamlTextAll(text) {
        return jsyaml.loadAll(text);
    },
    template(scope, uri) {
        const text = load.text(scope, uri);
        try {
            return _.template(text);
        } catch (e) {
            throw base.pktError(scope, e, `failed to parse template ${uri}`);
        }
    }
}

module.exports = load;
