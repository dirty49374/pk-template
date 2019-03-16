import jsyaml from 'js-yaml';
import { getLiveScript, getCoffeeScript } from '../lazy';
import { CustomYamlTag, CustomYamlTagTag, CustomYamlCsTag, CustomYamlLsTag, CustomYamlJsTag, CustomYamlFileTag, CustomYamlTemplateTag } from '../pk-template/types';


interface ITagData {
    type: string;
    data: string;
    src: string;
    uri: string;
}

function createCustomTag<T extends CustomYamlTag>(cls: new (data: string, src: string, uri: string) => T, name: string, compile: (text: string) => ITagData) {
    return new jsyaml.Type(`!${name}`, {
        kind: 'scalar',
        resolve: (data: any) =>
            typeof data === 'string' ||
            typeof data === 'number' ||
            typeof data === null,
        construct: (data: any) => {
            const compiled = compile(data);
            return new cls(compiled.data, data, compiled.uri);
        },
        instanceOf: cls,
        represent: (tag: any) => tag.represent(),
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
        const bin = getLiveScript().compile(data, { bare: true, map: 'embedded' });
        return bin.code;

    } catch (e) {
        console.log('failed to compile live script');
        throw e;
    }
}

export const pktYamlOption = (uri: string) => ({
    schema: jsyaml.Schema.create([
        createCustomTag(
            CustomYamlCsTag,
            'cs',
            (data: string) => ({ type: 'js', uri, data: compileCoffee(data), src: data })),
        createCustomTag(
            CustomYamlLsTag,
            'ls',
            (data: string) => ({ type: 'js', uri, data: compileLive(data), src: data })),
        createCustomTag(
            CustomYamlJsTag,
            'js',
            (data: string) => ({ type: 'js', uri, data, src: data })),
        createCustomTag(
            CustomYamlFileTag,
            'file',
            (data: string) => ({ type: 'file', uri, data, src: data })),
        createCustomTag(
            CustomYamlTemplateTag,
            'template',
            (data: string) => ({ type: 'template', uri, data, src: data })),
        createCustomTag(
            CustomYamlTagTag,
            'tag',
            (data: string) => ({ type: 'tag', uri, data, src: data })),
    ])
});
