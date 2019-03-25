import jsyaml from 'js-yaml';
import { CustomYamlTag, CustomYamlTagTag, CustomYamlCsTag, CustomYamlLsTag, CustomYamlJsTag, CustomYamlFileTag, CustomYamlTemplateTag } from './customTags';


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

export const pktYamlOption = (uri: string) => ({
    schema: jsyaml.Schema.create([
        new jsyaml.Type('!js', {
            kind: 'scalar',
            resolve: (data: any) => typeof data === 'string' || typeof data === 'number' || typeof data === null,
            construct: (data: any) => {
                return new CustomYamlJsTag(data, uri);
            },
            instanceOf: CustomYamlJsTag,
            represent: (tag: any) => tag.represent(),
        }),
        new jsyaml.Type('!cs', {
            kind: 'scalar',
            resolve: (data: any) => typeof data === 'string' || typeof data === 'number' || typeof data === null,
            construct: (data: any) => {
                return new CustomYamlCsTag(data, uri);
            },
            instanceOf: CustomYamlCsTag,
            represent: (tag: any) => tag.represent(),
        }),
        new jsyaml.Type('!ls', {
            kind: 'scalar',
            resolve: (data: any) => typeof data === 'string' || typeof data === 'number' || typeof data === null,
            construct: (data: any) => {
                return new CustomYamlLsTag(data, uri);
            },
            instanceOf: CustomYamlLsTag,
            represent: (tag: any) => tag.represent(),
        }),
        new jsyaml.Type('!file', {
            kind: 'scalar',
            resolve: (data: any) => typeof data === 'string' || typeof data === 'number' || typeof data === null,
            construct: (data: any) => {
                return new CustomYamlFileTag(data, uri);
            },
            instanceOf: CustomYamlLsTag,
            represent: (tag: any) => tag.represent(),
        }),
        new jsyaml.Type('!template', {
            kind: 'scalar',
            resolve: (data: any) => typeof data === 'string' || typeof data === 'number' || typeof data === null,
            construct: (data: any) => {
                return new CustomYamlTemplateTag(data, uri);
            },
            instanceOf: CustomYamlLsTag,
            represent: (tag: any) => tag.represent(),
        }),
        new jsyaml.Type('!tag', {
            kind: 'scalar',
            resolve: (data: any) => typeof data === 'string' || typeof data === 'number' || typeof data === null,
            construct: (data: any) => {
                return new CustomYamlLsTag(data, uri);
            },
            instanceOf: CustomYamlLsTag,
            represent: (tag: any) => tag.represent(),
        }),

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
