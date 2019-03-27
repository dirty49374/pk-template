import { IScope } from './types';
import { dumpYamlSortedKey } from '../pk-yaml';
import { createHash } from 'crypto';
import { execSync } from 'child_process';
import { resolve, relative } from 'path';

export interface IPktError extends Error {
    summary: string;
    uri: string;
    pos: string | null;
}

interface IKvpType {
    [id: string]: string
}

export const pktError = (scope: IScope | null, error: Error, message: string): IPktError => {
    const pe = error as IPktError;
    pe.summary = message;
    pe.uri = scope ? scope.uri : '.';
    pe.pos = (scope && scope.trace) ? scope.trace.pos() : null;
    return pe;
}

export const parseKvps = (value: string): IKvpType => {
    if (!value) return {};
    const kvps: IKvpType = {};
    value.split(';')
        .forEach(kvp => {
            const [key, value] = kvp.split('=');
            kvps[key.trim()] = value ? value.trim() : '';
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

export const sha256 = (obj: any, len?: number) => {
    const yaml = typeof obj === 'object'
        ? dumpYamlSortedKey(obj)
        : obj.toString();
    const hash = createHash('sha256');
    hash.update(yaml);
    return len ? hash.digest('hex').substr(0, len) : hash.digest('hex');
}

export const repository = (ref?: string) => {
    try {
        const r = execSync(`git config --get ${ref || 'remote.origin.url'}`);
        return r.toString('utf8').trim();
    } catch (e) {
        return 'unknown';
    }
}

export const repositoryPath = (path: string) => {
    try {
        const filePath = resolve(path);
        const gitRoot = execSync(`git rev-parse --show-toplevel`).toString('utf8').trim();
        console.log('gr=', gitRoot, 'fp=', filePath)
        return relative(gitRoot, filePath);
    } catch (e) {
        return 'unknown';
    }
}
