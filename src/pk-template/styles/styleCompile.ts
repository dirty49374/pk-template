import { getUnderscore } from "../../lazy";
import { forEachTreeObject } from "../../common";
import { parseParametericStyle as parseParametericStyles, parseEmptyStyles } from "./styleParser";
import { IStyle, IScope, ILanguageVm } from "../types";
import { PktRuntime } from "../languageSpec";

export const compileStyle = (vm: ILanguageVm<PktRuntime>, scope: IScope, object: any) => {
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
                            styles.push(...parseParametericStyles(styleType, vm.runtime.evalTemplate(vm, scope, item)));
                        }
                    } else {
                        styles.push(...parseParametericStyles(styleType, vm.runtime.evalTemplate(vm, scope, value)));
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
