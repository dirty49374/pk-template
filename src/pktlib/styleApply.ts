import { IObject } from "../common";
import { CustomYamlTag, pktError } from "./utils";
import { IScope, IStyleSheet } from "./types";
import { parseStyle } from "./styleParser";
const evalWithValues = require('../eval');

export class StyleApply {
    constructor(private tag: CustomYamlTag) {
        if (tag.type !== 'js') {
            throw new Error(`style type is not script`);
        }
    }
    apply(scope: IScope, object: IObject, rawStyles: any, parent: object) {
        try {
            const styles = parseStyle(rawStyles);
            for (let style of styles) {
                try {
                    const $ = {
                        ...scope,
                        ...scope.$buildLib(scope),
                        object,
                        style,
                        node: parent,
                    };
                    evalWithValues($, this.tag.code, scope.values);
                } catch (e) {
                    pktError(scope, e, `error in applying style '${style}'`);
                }
            }
        } catch (e) {
            pktError(scope, e, `error in parsing style '${rawStyles}'`);
        }
    }
}
