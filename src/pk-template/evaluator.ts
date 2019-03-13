import { IScope, CustomYamlTag } from "./types";
import { getUnderscore, getLiveScript } from "./lazy";
import { parseYamlAll } from "../pk-yaml";
import { forEachTreeObjectKey } from "../common";
import * as utils from './utils';

export class Evaluator {

    constructor(private scope: IScope) { }

    evalTemplate(tpl: string): string {
        const _ = getUnderscore();
        return _.template(tpl)({
            ...this.scope.values,
            $: this.scope
        });
    }

    private evalJavaScript(script: string, uri: string): any {
        return this.scope.eval(script, uri);
    }

    private evalLiveScript(src: string, uri: string): any {
        const data = getLiveScript().compile(src, { bare: true, map: 'embedded' });
        return this.evalJavaScript(data.code, uri);
    }

    evalCustomYamlTag(code: CustomYamlTag): any {
        switch (code.type) {
            case 'js':
                return this.evalJavaScript(code.code, code.uri);
            case 'file':
                return this.scope.loadText(code.code).data;
            case 'template':
                return this.scope.evalTemplate(code.code);
        }
    }

    evalScript(script: CustomYamlTag | string): any {
        try {
            if (script instanceof CustomYamlTag)
                return this.evalCustomYamlTag(script);
            return this.evalLiveScript(script, this.scope.uri);
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