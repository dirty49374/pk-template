import { IObject } from "../../common";
import { pktError } from "../utils";
import { IScope, IStyle } from "../types";
import { CustomYamlTag } from '../../pk-yaml';
const evalWithValues = require('../../eval');

export class StyleApply {
    constructor(
        private name: string,
        private tag: CustomYamlTag) {
        if (tag.type !== 'js') {
            throw new Error(`style type is not script`);
        }
    }

    private applyStyle(scope: IScope, object: IObject, node: object, style: IStyle) {
        try {
            let success = true;
            const $ = {
                ...scope,
                ...scope.$buildLib(scope),
                object,
                style,
                node,
                skip: () => success = false,
            };
            evalWithValues($, this.tag.code, scope.values);
            return success;
        } catch (e) {
            console.log(e);
            throw pktError(scope, e, `error in applying style ${this.name}: ${style}`);
        }
    }

    apply(scope: IScope, object: IObject, node: object, styleType: string, styles: IStyle[]): IStyle[] {

        const leftOvers: IStyle[] = [];
        for (let style of styles) {
            if (!this.applyStyle(scope, object, node, style)) {
                leftOvers.push(style);
            }
        }

        return leftOvers;
    }
}
