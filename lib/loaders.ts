import _ from 'underscore';
import fs from "fs";
import url from 'url';
import glob from 'glob';
import syncRequest from 'sync-request';

import * as utils from './utils';
import * as yamls from './yamls';
import { IScope } from './types';

_.templateSettings = {
    interpolate: /\<\<\<\=(.+?)\>\>\>/g,
    evaluate: /\<\<\<\_(.+?)\>\>\>/g,
};

export function isHttp(uri: string): boolean {
    const supportedProtocols = [ 'http:', 'https:' ];
    const parsed = url.parse(uri);
    return supportedProtocols.some(protocol => protocol == parsed.protocol);
}

export function loadText(scope: IScope | null, uri: string): string {
    try {
        return isHttp(uri)
            ? syncRequest('GET', uri).getBody('utf8')
            : fs.readFileSync(uri, 'utf8');
    } catch (e) {
        throw utils.pktError(scope, e, `failed to load ${uri}`);
    }
}

export function yaml(scope: IScope | null, uri: string): any {
    const str = loadText(scope, uri);
    try {
        return yamls.load(str);
    } catch (e) {
        throw utils.pktError(scope, e, `failed to parse yaml ${uri}`);
    }
}

export function yamlAll(scope: IScope, uri: string): any[] {
    const str = loadText(scope, uri);
    try {
        return yamls.loadAll(str);
    } catch (e) {
        throw utils.pktError(scope, e, `failed to parse yaml ${uri}`);
    }
}

export function pkt(scope: IScope, uri: string): IPkt {
    const str = loadText(scope, uri);
    try {
        return yamls.loadAsPkt(str);
    } catch (e) {
        throw utils.pktError(scope, e, `failed to parse yaml ${uri}`);
    }
}

export function template(scope: IScope, uri: string) {
    const str = loadText(scope, uri);
    try {
        return _.template(str);
    } catch (e) {
        throw utils.pktError(scope, e, `failed to parse template ${uri}`);
    }
}

export function files(scope: IScope, uri: string) {
    if (isHttp(uri)) {
        throw new Error(`cannot get directory listing from ${uri}`);
    }

    return fs.readdirSync(uri);
}

export function globs(scope: IScope, uri: string) {
    if (isHttp(uri)) {
        throw new Error(`cannot get directory listing from ${uri}`);
    }

    const list = glob.sync(uri);
    return list;
}

export function xx() {
    console.log('xxxxx')
}
