import { IScope, CustomYamlTag } from "./types";
import { getUnderscore, getLiveScript } from "./lazy";
import { parseYamlAll } from "../pk-yaml";
import { forEachTreeObjectKey } from "../common";
import * as utils from './utils';

const evalWithValues = require('../eval');

export class Evaluator {

    constructor(private scope: IScope) { }

    evalTemplate(tpl: string): string {
        const _ = getUnderscore();
        return _.template(tpl)({
            ...this.scope.values,
            $: this.scope
        });
    }

    private evalJavaScript(script: string): any {
        const $ = {
            ...this.scope,
            ...this.scope.$buildLib(this.scope)
        };
        return evalWithValues($, script, this.scope.values);
    }

    private evalLiveScript(script: string): any {
        const javascript = getLiveScript().compile(script, { bare: true });
        return this.evalJavaScript(javascript);
    }

    evalCustomYamlTag(code: CustomYamlTag): any {
        switch (code.type) {
            case 'js':
                return this.evalJavaScript(code.code);
            case 'file':
                return this.scope.loadText(code.code);
        }
    }

    evalScript(script: CustomYamlTag | string): any {
        try {
            if (script instanceof CustomYamlTag)
                return this.evalCustomYamlTag(script);
            return this.evalLiveScript(script);
        } catch (e) {
            throw utils.pktError(this.scope, e, `failed to evalute`);
        }
    }

    evalTemplateAll(text: string): any[] {
        try {
            const tpl = getUnderscore().template(text);
            const yaml = tpl({
                ...this.scope.values,
                $: this.scope
            });
            const objects = parseYamlAll(yaml);
            return objects;
        } catch (e) {
            throw utils.pktError(this.scope, e, 'failed to parse template');
        }
    }

    evalObject(object: any): any {
        object = this.evalAllCustomTags(object);
        this.expandCaretPath(object);
        this.expandStyleSheet(object);

        return object;
    }

    expandCaretPath(object: any) {
        forEachTreeObjectKey(object, (node: any, key: string, value: any) => {
            if (key.startsWith('^') && key.length > 1) {
                delete node[key];
                utils.setValue(node, key.substr(1), value);
            }
        });
    }

    evalAllCustomTags(node: any): any {
        if (node instanceof CustomYamlTag) {
            return this.evalCustomYamlTag(node);
        } else if (Array.isArray(node)) {
            return node.map(item => this.evalAllCustomTags(item));
        } else if (typeof node === 'object') {
            if (node === null) return node;

            const clone: any = {};
            Object.keys(node)
                .forEach((key: string) => clone[key] = this.evalAllCustomTags(node[key]));
            return clone;
        }
        return node;
    }

    expandStyleSheet(object: any): void {
        this.scope.expandStyle(object);
    }
}
