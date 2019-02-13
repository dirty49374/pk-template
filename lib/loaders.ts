import _ from 'underscore';
import fs from "fs";
import url from 'url';
import glob from 'glob';
import syncRequest from 'sync-request';

import * as utils from './utils';
import * as yamls from './yamls';
import { load } from 'js-yaml';
import { IScope } from './scope';

_.templateSettings = {
    interpolate: /\<\<\<\=(.+?)\>\>\>/g,
    evaluate: /\<\<\<\_(.+?)\>\>\>/g,
};

const loaders = {
    isHttp(uri: string): boolean {
        const supportedProtocols = [ 'http:', 'https:' ];
        const parsed = url.parse(uri);
        return supportedProtocols.some(protocol => protocol == parsed.protocol);
    },
    text(scope: IScope, uri: string): string {
        try {
            return loaders.isHttp(uri)
                ? syncRequest('GET', uri).getBody('utf8')
                : fs.readFileSync(uri, 'utf8');
        } catch (e) {
            throw utils.pktError(scope, e, `failed to load ${uri}`);
        }
    },
    yaml(scope: IScope, uri: string): any {
        const text = loaders.text(scope, uri);
        try {
            return yamls.load(text);
        } catch (e) {
            throw utils.pktError(scope, e, `failed to parse yaml ${uri}`);
        }
    },
    yamlAll(scope: IScope, uri: string): any[] {
        const text = loaders.text(scope, uri);
        try {
            return yamls.loadAll(text);
        } catch (e) {
            throw utils.pktError(scope, e, `failed to parse yaml ${uri}`);
        }
    },
    pkt(scope: IScope, uri: string): IPkt {
        const text = loaders.text(scope, uri);
        try {
            return yamls.loadAsPkt(text);
        } catch (e) {
            throw utils.pktError(scope, e, `failed to parse yaml ${uri}`);
        }
    },
    template(scope: IScope, uri: string) {
        const text = loaders.text(scope, uri);
        try {
            return _.template(text);
        } catch (e) {
            throw utils.pktError(scope, e, `failed to parse template ${uri}`);
        }
    },
    files(scope: IScope, uri: string) {
        if (loaders.isHttp(uri)) {
            throw new Error(`cannot get directory listing from ${uri}`);
        }

        return fs.readdirSync(uri);
    },
    globs(scope: IScope, uri: string) {
        if (loaders.isHttp(uri)) {
            throw new Error(`cannot get directory listing from ${uri}`);
        }

        const list = glob.sync(uri);
        return list;
    },
};

export default loaders;
