import { IScope } from './types';


interface PktError extends Error {
    summary: string;
    uri: string;
}

interface KvpType {
    [id: string]: string
}

export const pktError = (scope: IScope | null, error: Error, message: string): PktError => {
    const pe = error as PktError;
    pe.summary = message;
    pe.uri = scope ? scope.uri : '.';
    return pe;
}

export class CustomYamlTag {
    constructor(public type: string, public code: string) { }
}

export const parseKvps = (value: string): KvpType => {
    if (!value) return {};
    const kvps: KvpType = {};
    value.split(';')
        .forEach(kvp => {
            const [key, value] = kvp.split('=');
            kvps[key.trim()] = value.trim();
        });
    return kvps;
}

export const parseList = (value: string): string[] => {
    if (!value) return [];
    return value.split(';').map(p => p.trim());
}

const _setValue = (node: any, pathes: string[], value: any) => {
    if (true) {
        const key = pathes[0];
        if (pathes.length == 1) {
            node[key] = value;
        } else {
            const child = key in node ? node[key] : (node[key] = {});
            pathes.shift();
            _setValue(child, pathes, value);
        }
    }
}

export const setValue = (node: any, path: string, value: any) => {
    _setValue(node, path.split('.'), value);
}
