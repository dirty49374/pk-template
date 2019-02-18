import jsyaml from 'js-yaml';
import { getLiveScript, getCoffeeScript } from '../pk-lib/lazy';
import { CustomYamlTag } from './types';


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
            return new CustomYamlTag(compiled.type, compiled.code);
        },
        instanceOf: CustomYamlTag,
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
    createCustomTag(
        'cs',
        (data: string) => ({ type: 'js', code: compileCoffee(data) })),
    createCustomTag(
        'coffeeScript',
        (data: string) => ({ type: 'js', code: compileCoffee(data) })),
    createCustomTag(
        'ls',
        (data: string) => ({ type: 'js', code: compileLive(data) })),
    createCustomTag(
        'liveScript',
        (data: string) => ({ type: 'js', code: compileLive(data) })),
    createCustomTag(
        'js',
        (data: string) => ({ type: 'js', code: data })),
    createCustomTag(
        'javaScript',
        (data: string) => ({ type: 'js', code: data })),
    createCustomTag(
        'file',
        (data: string) => ({ type: 'file', code: data })),
]);

export const pktYamlOption = { schema: PKT_SCHEMA };
