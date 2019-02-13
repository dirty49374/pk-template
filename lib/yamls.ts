import jsyaml from 'js-yaml';
import liveScript from 'livescript';
import coffeeScript from 'coffeescript';
const utils = require('./utils');

interface TagData {
    type: string;
    code: string;
}

const createCustomTag = (name: string, compile: (text: string)=>TagData) => {
    return new jsyaml.Type(`!${name}`, {
        kind: 'scalar',
        resolve: (data: any) =>
                typeof data === 'string' ||
                typeof data === 'number' ||
                typeof data === null,
        construct: (data: any) => {
            const compiled = compile(data);
            return new utils.JavaScriptCode(compiled.type, compiled.code);
        },
        instanceOf: utils.JavaScriptCode,
        represent: (jsCode: any) => `!${name} ${jsCode.code}`
    });
}


const PKT_SCHEMA = jsyaml.Schema.create([
    createCustomTag('cs', (data: string) => ({ type: 'js', code: coffeeScript.compile(data, { bare: true }) })),
    createCustomTag('coffeeScript', (data: string) => ({ type: 'js', code: coffeeScript.compile(data, { bare: true }) })),
    createCustomTag('ls', (data: string) => ({ type: 'js', code: liveScript.compile(data, { bare: true }) })),
    createCustomTag('liveScript', (data: string) => ({ type: 'js', code: liveScript.compile(data, { bare: true }) })),
    createCustomTag('js', (data: string) => ({ type: 'js', code: data })),
    createCustomTag('javaScript', (data: string) => ({ type: 'js', code: data })),
    createCustomTag('file', (data: string) => ({ type: 'file', code: data })),
]);

const pktYamlOption = { schema: PKT_SCHEMA };

export const load = (text: string): any => jsyaml.load(text);
export const loadAll = (text: string): any[] => jsyaml.loadAll(text);
export const loadAsPkt = (text: string): any => jsyaml.load(text, pktYamlOption);
