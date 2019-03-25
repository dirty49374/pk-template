import fs from "fs";
import url from 'url';
import * as utils from './utils';
import { IScope, ILoader, IPkt } from './types';
import { getUnderscore, getSyncRequest } from '../lazy';
import { parseYaml, parseYamlAll, parseYamlAsPkt } from "../pk-yaml";

function isHttp(uri: string): boolean {
    const supportedProtocols = ['http:', 'https:'];
    const parsed = url.parse(uri);
    return supportedProtocols.some(protocol => protocol == parsed.protocol);
}
export class Loader implements ILoader {
    constructor(private scope: IScope) { }

    loadText(uri: string): { uri: string, data: string } {
        uri = this.scope.resolve(uri);
        try {
            return {
                uri,
                data: isHttp(uri)
                    ? getSyncRequest()('GET', uri).getBody('utf8')
                    : fs.readFileSync(uri, 'utf8')
            };
        } catch (e) {
            throw utils.pktError(this.scope, e, `failed to load ${uri}`);
        }
    }

    loadYaml(uri: string): { uri: string, data: any } {
        const rst = this.loadText(uri);
        try {
            return {
                uri: rst.uri,
                data: parseYaml(rst.data),
            };
        } catch (e) {
            throw utils.pktError(this.scope, e, `failed to parse yaml ${uri}`);
        }
    }

    loadYamlAll(uri: string): { uri: string, data: any[] } {
        const rst = this.loadText(uri);
        try {
            return {
                uri: rst.uri,
                data: parseYamlAll(rst.data),
            };
        } catch (e) {
            throw utils.pktError(this.scope, e, `failed to parse yaml ${uri}`);
        }
    }

    loadPkt(uri: string): { uri: string, data: IPkt } {
        const rst = this.loadText(uri);
        try {
            const yamls = parseYamlAsPkt(rst.data, rst.uri);
            if (yamls.length == 0) {
                return { uri: rst.uri, data: { header: {}, statements: [] } }
            }
            if (yamls[0]['/properties'] || yamls[0]['/schema']) {
                const header = yamls[0];
                return { uri: rst.uri, data: { header, statements: yamls.slice(1) } }
            }
            return {
                uri: rst.uri,
                data: { header: {}, statements: yamls },
            };
        } catch (e) {
            throw utils.pktError(this.scope, e, `failed to parse yaml ${uri}`);
        }
    }

    loadTemplate(uri: string): { uri: string, data: string } {
        const rst = this.loadText(uri);
        try {
            return {
                uri: rst.uri,
                data: getUnderscore().template(rst.data),
            };
        } catch (e) {
            throw utils.pktError(this.scope, e, `failed to parse template ${uri}`);
        }
    }

    listFiles(uri: string): { uri: string, data: string[] } {
        uri = this.scope.resolve(uri);
        if (isHttp(uri)) {
            throw new Error(`cannot get directory listing from ${uri}`);
        }

        return {
            uri,
            data: fs.readdirSync(uri),
        };
    }
}
