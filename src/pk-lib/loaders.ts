import fs from "fs";
import url from 'url';
import * as utils from './utils';
import { IScope, IPkt } from './types';
import { getGlob, getUnderscore, getSyncRequest } from './lazy';
import { loadYaml, loadYamlAll, loadYamlAsPkt } from "../pk-yaml";

export function isHttp(uri: string): boolean {
    const supportedProtocols = ['http:', 'https:'];
    const parsed = url.parse(uri);
    return supportedProtocols.some(protocol => protocol == parsed.protocol);
}

export function loadText(scope: IScope | null, uri: string): string {
    try {
        return isHttp(uri)
            ? getSyncRequest()('GET', uri).getBody('utf8')
            : fs.readFileSync(uri, 'utf8');
    } catch (e) {
        throw utils.pktError(scope, e, `failed to load ${uri}`);
    }
}

export function yaml(scope: IScope | null, uri: string): any {
    const str = loadText(scope, uri);
    try {
        return loadYaml(str);
    } catch (e) {
        throw utils.pktError(scope, e, `failed to parse yaml ${uri}`);
    }
}

export function yamlAll(scope: IScope, uri: string): any[] {
    const str = loadText(scope, uri);
    try {
        return loadYamlAll(str);
    } catch (e) {
        throw utils.pktError(scope, e, `failed to parse yaml ${uri}`);
    }
}

export function pkt(scope: IScope, uri: string): IPkt {
    const str = loadText(scope, uri);
    try {
        return loadYamlAsPkt(str);
    } catch (e) {
        throw utils.pktError(scope, e, `failed to parse yaml ${uri}`);
    }
}

export function template(scope: IScope, uri: string) {
    const str = loadText(scope, uri);
    try {
        return getUnderscore().template(str);
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
