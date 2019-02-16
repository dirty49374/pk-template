import jsyaml from 'js-yaml';
import * as utils from './utils';
import { getLiveScript, getCoffeeScript } from './lazy';


interface TagData {
    type: string;
    code: string;
}

const createCustomTag = (name: string, compile: (text: string) => TagData) => {
    return new jsyaml.Type(`!${name}`, {
        kind: 'scalar',
        resolve: (data: any) =>
            typeof data === 'string' ||
            typeof data === 'number' ||
            typeof data === null,
        construct: (data: any) => {
            const compiled = compile(data);
            return new utils.CustomYamlTag(compiled.type, compiled.code);
        },
        instanceOf: utils.CustomYamlTag,
        represent: (jsCode: any) => `!${name} ${jsCode.code}`
    });
}

const compileCoffee = (data: string): string => {
    try {
        return getCoffeeScript().compile(data, { bare: true });
    } catch (e) {
        console.log('failed to compile coffee script');
        throw e;
    }
}

const compileLive = (data: string): string => {
    try {
        return getLiveScript().compile(data, { bare: true });
    } catch (e) {
        console.log('failed to compile live script');
        throw e;
    }
}

const PKT_SCHEMA = jsyaml.Schema.create([
    createCustomTag('cs', (data: string) => ({ type: 'js', code: compileCoffee(data) })),
    createCustomTag('coffeeScript', (data: string) => ({ type: 'js', code: compileCoffee(data) })),
    createCustomTag('ls', (data: string) => ({ type: 'js', code: compileLive(data) })),
    createCustomTag('liveScript', (data: string) => ({ type: 'js', code: compileLive(data) })),
    createCustomTag('js', (data: string) => ({ type: 'js', code: data })),
    createCustomTag('javaScript', (data: string) => ({ type: 'js', code: data })),
    createCustomTag('file', (data: string) => ({ type: 'file', code: data })),
]);

const pktYamlOption = { schema: PKT_SCHEMA };

export const load = (text: string): any => jsyaml.load(text);
export const loadAll = (text: string): any[] => jsyaml.loadAll(text);
export const loadAsPkt = (text: string): any => jsyaml.load(text, pktYamlOption);
