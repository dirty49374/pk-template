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
        construct: data => {
            const compiled = compile(data);
            return new utils.JavaScriptCode(compiled.type, compiled.code);
        },
        instanceOf: utils.JavaScriptCode,
        represent: jsCode => `!${name} ${jsCode.code}`
    });
}

const PKT_SCHEMA = jsyaml.Schema.create([
    createCustomTag('cs', data => ({ type: 'js', code: coffeeScript.compile(data, { bare: true }) })),
    createCustomTag('coffeeScript', data => ({ type: 'js', code: coffeeScript.compile(data, { bare: true }) })),
    createCustomTag('ls', data => ({ type: 'js', code: liveScript.compile(data, { bare: true }) })),
    createCustomTag('liveScript', data => ({ type: 'js', code: liveScript.compile(data, { bare: true }) })),
    createCustomTag('js', data => ({ type: 'js', code: data })),
    createCustomTag('javaScript', data => ({ type: 'js', code: data })),
    createCustomTag('file', data => ({ type: 'file', code: data })),
]);

const pktYamlOption = { schema: PKT_SCHEMA };

const yamls = {
    load: text => jsyaml.load(text),
    loadAll: text => jsyaml.loadAll(text),
    loadAsPkt: (text) => jsyaml.load(text, pktYamlOption),
};

module.exports = yamls;
