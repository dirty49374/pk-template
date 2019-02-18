import { IObject } from "../common";
import { CustomYamlTag, pktError } from "./utils";
import { IScope, IStyleSheet, IStyle } from "./types";
import { parseStyle } from "./styleParser";
const evalWithValues = require('../eval');

export class StyleApply {
    constructor(
        private name: string,
        private tag: CustomYamlTag) {
        if (tag.type !== 'js') {
            throw new Error(`style type is not script`);
        }
    }

    private applyStyle(scope: IScope, object: IObject, parent: object, style: IStyle) {
        try {
            let success = true;
            const $ = {
                ...scope,
                ...scope.$buildLib(scope),
                object,
                style,
                node: parent,
                skip: () => success = false,
            };
            evalWithValues($, this.tag.code, scope.values);
            return success;
        } catch (e) {
            console.log(e);
            throw pktError(scope, e, `error in applying style ${this.name}: ${style}`);
        }
    }

    apply(scope: IScope, object: IObject, styles: IStyle[], parent: object): IStyle[] {

        console.log('!!!', styles)
        const leftOvers: IStyle[] = [];
        for (let style of styles) {
            if (!this.applyStyle(scope, object, parent, style)) {
                console.log('skip 1', this.name)
                leftOvers.push(style);
            } else {
                console.log('accept 1', this.name)
            }
        }
        return leftOvers;
    }
}
