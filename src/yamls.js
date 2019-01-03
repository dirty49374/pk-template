const jsyaml = require('js-yaml');
const liveScript = require('livescript');
const coffeeScript = require('coffeescript');
const utils = require('./utils');

const createCustomTag = (name, compile) => {
    return new jsyaml.Type(`!${name}`, {
        kind: 'scalar',
        resolve: data =>
                typeof data === 'string' ||
                typeof data === number ||
                typeof data === null,
        construct: data => new utils.JavaScriptCode(compile ? compile(data) : data),
        instanceOf: utils.JavaScriptCode,
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

const yamls = {
    load: text => jsyaml.load(text),
    loadAll: text => jsyaml.loadAll(text),
    loadAsPkt: (text) => jsyaml.load(text, pktYamlOption),
};

module.exports = yamls;
