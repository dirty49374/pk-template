import { IObject } from "../../common";
import { pktError } from "../utils";
import { IScope, IStyle, CustomYamlTag } from "../types";

export class StyleApply {
    constructor(
        private name: string,
        private tag: CustomYamlTag) {
        if (!tag.isScript()) {
            throw new Error(`style type(${tag.type}) is not script`);
        }
    }

    applyStyle(scope: IScope, object: IObject, node: object, style: IStyle) {
        try {
            let success = true;
            scope.eval(this.tag.code, this.tag.uri, {
                object,
                style,
                node,
                skip: () => success = false,
            });
            return success;
        } catch (e) {
            throw pktError(scope, e, `error in applying style ${this.name}: ${style}`);
        }
    }
}
