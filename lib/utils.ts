import _ from 'underscore';
import { IScope } from './scope';

_.templateSettings = {
    interpolate: /\<\<\<\=(.+?)\>\>\>/g,
    evaluate: /\<\<\<\_(.+?)\>\>\>/g,
};

interface PktError extends Error {
    summary: string;
    uri: string;
}

interface KvpType {
    [ id: string ]: string
}

export const pktError = (scope: IScope, error: Error, message: string): PktError => {
    const pe = error as PktError;
    pe.summary = message;
    pe.uri = scope ? scope.uri : '.';
    return pe;
}

export class JavaScriptCode {
    constructor(public type: string, public code: string) {}
}

export const parseKvps = (value: string): KvpType => {
    if (!value) return {};
    const kvps: KvpType = {};
    value.split(';')
        .forEach(kvp => {
            const [ key, value ] = kvp.split('=');
            kvps[key.trim()] = value.trim();
        });
    return kvps;
}

export const parseList = (value: string): string[] => {
    if (!value) return [];
    return value.split(';').map(p => p.trim());
}

module.exports = { pktError, JavaScriptCode, parseKvps, parseList };