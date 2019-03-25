import { IScope } from "./types";
import { getUnderscore, getLiveScript } from "../lazy";
import { parseYamlAll } from "../pk-yaml";
import { forEachTreeObjectKey } from "../common";
import * as utils from './utils';
import { CustomYamlTag } from "../pk-yaml/customTags";

export class Evaluator {

    constructor(private scope: IScope) { }

    evalTemplate(tpl: string): string {
        const _ = getUnderscore();
        return _.template(tpl)({
            ...this.scope.values,
            $: {
                ...this.scope.$buildLib(this),
                ...this.scope,
            }
        });
    }

    // evalCustomYamlTag(tag: CustomYamlTag): any {
    //     return tag.evaluate(this.scope, {

    //     });
    //     // if (tag instanceof CustomYamlJsTag ||
    //     //     tag instanceof CustomYamlLsTag ||
    //     //     tag instanceof CustomYamlCsTag) {
    //     //     return this.evalJavaScript(tag.code, tag.uri);
    //     // } else if (tag instanceof CustomYamlFileTag) {
    //     //     return this.scope.loadText(tag.code).data;
    //     // } else if (tag instanceof CustomYamlTemplateTag) {
    //     //     return this.scope.evalTemplate(tag.code);
    //     // } else if (tag instanceof CustomYamlTagTag) {
    //     //     return tag.convert();
    //     // }
    // }

    // // evalScript(script: CustomYamlTag | string): any {
    // //     try {
    // //         if (script instanceof CustomYamlTag)
    // //             return this.scope.evalTag(script);
    // //         // return this.evalLiveScript(script, this.scope.uri);
    // //     } catch (e) {
    // //         throw utils.pktError(this.scope, e, `failed to evalute`);
    // //     }
    // }

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
        this.deleteUndefined(object);

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
            return this.scope.eval(node);
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

    deleteUndefined(node: any) {
        if (node === undefined) {
            return;
        }
        if (Array.isArray(node)) {
            for (let i = node.length - 1; i >= 0; --i) {
                const val = node[i];
                if (val === undefined) {
                    node.splice(i, 1);
                } else {
                    this.deleteUndefined(node[i]);
                }
            }
        } else if (typeof node === 'object') {
            if (node === null) return node;
            Object.keys(node)
                .forEach((key: string) => {
                    const val = node[key];
                    if (val === undefined) {
                        delete node[key];
                    } else {
                        this.deleteUndefined(node[key]);
                    }
                });
        }
    }

    expandStyleSheet(object: any): void {
        this.scope.expandStyle(object);
    }
}
