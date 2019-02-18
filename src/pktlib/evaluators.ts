import * as utils from './utils';
import * as yamls from './yamls';
import * as loaders from './loaders';
import { IScope, IStyleSheet } from './types';
import { getCoffeeScript, getLiveScript, getUnderscore } from './lazy';
import { IObject, forEachTreeObjectKey } from '../common';
import { parseStyle } from './styleParser';

const evalWithValues = require('../eval');


export class PkYamlEvaluator {

    private object: object | null = null;

    constructor(private scope: IScope) {
    }

    evaluateCustomTag(node: any): any {
        if (node instanceof utils.CustomYamlTag) {
            return javaScriptCode(this.scope, node);
        } else if (Array.isArray(node)) {
            return node.map(item => this.evaluateCustomTag(item));
        } else if (typeof node === 'object') {
            if (node === null) return node;

            const clone: any = {};
            Object.keys(node)
                .forEach((key: string) => clone[key] = this.evaluateCustomTag(node[key]));
            return clone;
        }
        return node;
    }

    private setValue(node: any, pathes: string[], value: any) {
        if (true) {
            const key = pathes[0];
            if (pathes.length == 1) {
                node[key] = value;
            } else {
                const child = key in node ? node[key] : (node[key] = {});
                pathes.shift();
                this.setValue(child, pathes, value);
            }
        }
    }

    processDotPath(node: any) {
        forEachTreeObjectKey(node, (object: any, key: string, value: any): boolean => {
            if (key.startsWith('^')) {
                delete object[key];
                const pathes = key.substr(1).split('.');
                this.setValue(object, pathes, value);
            }
            return true;
        });
    }

    compileStyle(node: any) {
        forEachTreeObjectKey(node, (object: any, key: string, value: any): boolean => {
            if (key.endsWith('^')) {
                node[key] = parseStyle(value);
            }
            return true;
        });
    }

    evaluate(object: IObject) {
        this.object = this.evaluateCustomTag(object);
        this.processDotPath(this.object);
        this.compileStyle(this.object);
        this.scope.styleSheet.apply(this.scope, this.object)

        return this.object;
    }
}

export function doEval(scope: IScope, script: string) {
    const $ = {
        ...scope,
        ...scope.$buildLib(scope)
    };
    return evalWithValues($, script, scope.values);
}

export function deep(scope: IScope, object: any): any {
    return new PkYamlEvaluator(scope).evaluate(object);
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
    const javascript = getCoffeeScript().compile(coffeescript, { bare: true });
    return javaScript(scope, javascript);
}

export function liveScript(scope: IScope, livescript: string): any {
    const javascript = getLiveScript().compile(livescript + '\n', { bare: true });
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
        const tpl = getUnderscore().template(text);
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
