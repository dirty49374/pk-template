import jsyaml from 'js-yaml';
import { getLiveScript, getCoffeeScript } from '../pk-lib/lazy';
import { CustomYamlTag } from '../pk-lib/types';


interface ITagData {
    type: string;
    data: string;
    uri: string;
}

const createCustomTag = (name: string, compile: (text: string) => ITagData) => {
    return new jsyaml.Type(`!${name}`, {
        kind: 'scalar',
        resolve: (data: any) =>
            typeof data === 'string' ||
            typeof data === 'number' ||
            typeof data === null,
        construct: (data: any) => {
            const compiled = compile(data);
            return new CustomYamlTag(compiled.type, compiled.data, compiled.uri);
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
export const pktYamlOption = (uri: string) => ({
    schema: jsyaml.Schema.create([
        createCustomTag(
            'cs',
            (data: string) => ({ type: 'js', uri, data: compileCoffee(data) })),
        createCustomTag(
            'coffeeScript',
            (data: string) => ({ type: 'js', uri, data: compileCoffee(data) })),
        createCustomTag(
            'ls',
            (data: string) => ({ type: 'js', uri, data: compileLive(data) })),
        createCustomTag(
            'liveScript',
            (data: string) => ({ type: 'js', uri, data: compileLive(data) })),
        createCustomTag(
            'js',
            (data: string) => ({ type: 'js', uri, data })),
        createCustomTag(
            'javaScript',
            (data: string) => ({ type: 'js', uri, data })),
        createCustomTag(
            'file',
            (data: string) => ({ type: 'file', uri, data })),
    ])
});
