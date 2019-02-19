import * as utils from './utils';
import * as loaders from './loaders';
import { IScope, IStyle } from './types';
import { getCoffeeScript, getLiveScript, getUnderscore } from './lazy';
import { IObject, forEachTreeObjectKey, forEachTreeObject } from '../common';
import { parseStyle } from './styles/styleParser';
import { CustomYamlTag, loadYamlAll } from '../pk-yaml';

const evalWithValues = require('../eval');


export class PkYamlEvaluator {

    private object: object | null = null;
    private emptyStyle: IStyle[];
    constructor(private scope: IScope) {
        this.emptyStyle = [];
        (this.emptyStyle as any).name = '';
    }

    evaluateCustomTag(node: any): any {
        if (node instanceof CustomYamlTag) {
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

    processDotPath(object: any) {
        forEachTreeObjectKey(object, (node: any, key: string, value: any): boolean => {
            if (key.startsWith('^') && key.length > 1) {
                delete node[key];
                utils.setValue(node, key.substr(1), value);
            }
            return true;
        });
    }

    compileStyle(object: any) {
        const _ = getUnderscore();
        forEachTreeObject(object, (node: any) => {

            const styles: any = [];
            for (const key of Object.keys(node)) {
                if (key.endsWith('^')) {
                    const value = node[key];
                    if (value == null) {
                        delete node[key];
                        continue;
                    }
                    if (key.length === 1) {
                        if (Array.isArray(value)) {
                            for (const v of value) {
                                const list = v.split(/\s+/)
                                    .filter((p: string) => p)
                                    .map((t: string) => ({ type: t, style: this.emptyStyle }));
                                styles.push(...list);
                            }
                        } else {
                            const list = value.split(/\s+/)
                                .filter((p: string) => p)
                                .map((t: string) => ({ type: t, style: this.emptyStyle }));
                            styles.push(...list);
                        }
                    } else {
                        if (Array.isArray(value)) {
                            for (const vv of value) {
                                const list = vv
                                    .map((v: string) => _.template(v))
                                    .map((tpl: any) => tpl({ ...this.scope.values, $: this.scope }));
                                styles.push(...parseStyle(list).map(s => ({ type: key.substr(0, key.length - 1), style: s })));
                            }
                        } else {
                            const list = _.template(value)({
                                ...this.scope.values,
                                $: this.scope
                            });
                            styles.push(...parseStyle(list).map(s => ({ type: key.substr(0, key.length - 1), style: s })));
                        }
                    }
                    delete node[key];
                }
            }
            if (styles.length != 0) {
                node['^'] = styles;
            }
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

export function javaScriptCode(scope: IScope, code: CustomYamlTag) {
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

export function script(scope: IScope, script: CustomYamlTag | string): any {
    try {
        if (script instanceof CustomYamlTag)
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
        const objects = loadYamlAll(yaml);
        return objects;
    } catch (e) {
        throw utils.pktError(scope, e, 'failed to parse template');
    }
}
