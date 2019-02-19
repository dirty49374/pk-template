import { IScope } from './types';

interface IPktError extends Error {
    summary: string;
    uri: string;
}

interface IKvpType {
    [id: string]: string
}

export const pktError = (scope: IScope | null, error: Error, message: string): IPktError => {
    const pe = error as IPktError;
    pe.summary = message;
    pe.uri = scope ? scope.uri : '.';
    return pe;
}

export const parseKvps = (value: string): IKvpType => {
    if (!value) return {};
    const kvps: IKvpType = {};
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

export async function readStdin(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const chunks: any[] = [];

        process.stdin.resume();
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', function (chunk) {
            chunks.push(chunk);
        });

        process.stdin.on('end', function () {
            var all = chunks.join('');
            resolve(all);
        });

        process.stdin.on('error', function (error) {
            reject(error);
        })
    });
}
