import _ from 'underscore';
import lsEngine from 'livescript';
import csEngine from 'coffeescript';
import * as utils from './utils';
import * as yamls from './yamls';
import * as loaders from './loaders';
import { IScope } from './types';

const evalWithValues = require('../eval');

export function doEval(scope: IScope, script: string) {
    const $ = {
        ...scope,
        ...scope.$buildLib(scope)
    };
    return evalWithValues($, script, scope.values);
}

export function deep(scope: IScope, object: any): any {
    if (object instanceof utils.CustomYamlTag) {
        return javaScriptCode(scope, object);
    }

    if (Array.isArray(object)) {
        return object.map(item => deep(scope, item));
    }

    if (typeof object === 'object') {
        if (object === null) return object;

        const clone: any = {};
        Object.keys(object)
            .forEach(key => clone[key] = deep(scope, object[key]));
        return clone;
    }
    return object;
}

export function javaScript(scope: IScope, javascript: string): any {
    return doEval(scope, javascript);
}

export function javaScriptCode(scope: IScope, code: utils.CustomYamlTag) {
    switch (code.type) {
        case 'js':
            return javaScript(scope, code.code);
        case 'file':
            const uri = scope.resolve(code.code);
            return loaders.loadText(scope, uri);
    }
}

export function coffeeScript(scope: IScope, coffeescript: string): any {
    const javascript = csEngine.compile(coffeescript, { bare: true });
    return javaScript(scope, javascript);
}

export function liveScript(scope: IScope, livescript: string): any {
    const javascript = lsEngine.compile(livescript + '\n', { bare: true });
    return javaScript(scope, javascript);
}

export function script(scope: IScope, script: utils.CustomYamlTag | string): any {
    try {
        if (script instanceof utils.CustomYamlTag)
            return javaScriptCode(scope, script);
        return liveScript(scope, script);
    } catch (e) {
        throw utils.pktError(scope, e, `failed to evalute`);
    }
}

export function template(scope: IScope, text: string): any[] {
    try {
        const tpl = _.template(text);
        const yaml = tpl({
            ...scope.values,
            $: scope
        });
        const objects = yamls.loadAll(yaml);
        return objects;
    } catch (e) {
        throw utils.pktError(scope, e, 'failed to parse template');
    }
}
