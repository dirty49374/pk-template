import { getUnderscore } from "../lazy";
import { forEachTreeObject } from "../../common";
import { parseParametericStyle as parseParametericStyles, parseEmptyStyles } from "./styleParser";
import { IStyle, IScope } from "../types";

export const compileStyle = (scope: IScope, object: any) => {
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

                if (key === '^') {
                    if (Array.isArray(value)) {
                        for (const item of value) {
                            styles.push(...parseEmptyStyles(item));
                        }
                    } else {
                        styles.push(...parseEmptyStyles(value));
                    }
                } else {
                    const styleType = key.substr(0, key.length - 1);
                    if (Array.isArray(value)) {
                        for (const item of value) {
                            styles.push(...parseParametericStyles(styleType, scope.evaluator.evalTemplate(item)));
                        }
                    } else {
                        styles.push(...parseParametericStyles(styleType, scope.evaluator.evalTemplate(value)));
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
