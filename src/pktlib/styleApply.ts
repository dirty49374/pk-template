import { IObject } from "../common";
import { CustomYamlTag, pktError } from "./utils";
import { IScope, IStyleSheet, IStyle } from "./types";
import { parseStyle } from "./styleParser";
const evalWithValues = require('../eval');

export class StyleApply {
    constructor(private tag: CustomYamlTag) {
        if (tag.type !== 'js') {
            throw new Error(`style type is not script`);
        }
    }

    private parseStyles(scope: IScope, rawStyles: any) {
        try {
            return parseStyle(rawStyles);
        } catch (e) {
            throw pktError(scope, e, `error in parsing style '${rawStyles}'`);
        }
    }

    private applyStyle(scope: IScope, object: IObject, parent: object, style: IStyle) {
        try {
            const $ = {
                ...scope,
                ...scope.$buildLib(scope),
                object,
                style,
                node: parent,
            };
            const pass = evalWithValues($, this.tag.code, scope.values);
            return pass !== 'pass';
        } catch (e) {
            console.log(e);
            throw pktError(scope, e, `error in applying style '${style}'`);
        }
    }

    private applyStyles(scope: IScope, object: IObject, parent: object, styles: IStyle[]): IStyle[] {
        const leftOvers: IStyle[] = [];
        for (let style of styles) {
            if (!this.applyStyle(scope, object, parent, style)) {
                leftOvers.push(style);
            }
        }
        return leftOvers;
    }

    apply(scope: IScope, object: IObject, rawStyles: any, parent: object) {

        let styles: IStyle[] = this.parseStyles(scope, rawStyles);

        while (true) {
            if (styles.length == 0)
                return;

            const leftovers = this.applyStyles(scope, object, parent, styles);
            if (styles.length === leftovers.length) {
                for (const style of leftovers) {
                    console.log(`cannot process style ${style.name}`)
                }
                throw pktError(scope, new Error(), `cannot process style`);
            }

            styles = leftovers;
        }
    }
}
