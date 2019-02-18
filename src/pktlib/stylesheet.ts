import { IObject, forEachTreeObjectKey } from "../common";
import { CustomYamlTag } from "./utils";
import { IScope, IStyleSheet, IStyle } from "./types";
import { StyleApply } from "./styleApply";

export class StyleSheet implements IStyleSheet {
    // constructor(private classes: { [id: string]: IClassHandler }) {
    private styleSheets: { [name: string]: StyleApply };
    constructor(private parent: IStyleSheet | null) {
        this.styleSheets = {};
    }

    applyStyles(scope: IScope, object: IObject, parent: object, styleType: string, styles: IStyle[]): IStyle[] {
        const styleApply = this.styleSheets[styleType];
        if (styleApply) {
            return styleApply.apply(scope, object, styles, parent);
        }
        if (this.parent) {
            return this.parent.applyStyles(scope, object, parent, styleType, styles);
        }
        return styles;
    }

    load(styles: object[]): any {
        for (const map of styles) {
            for (const key of Object.keys(map)) {
                const code = (map as any)[key];
                if (code instanceof CustomYamlTag) {
                    this.styleSheets[key] = new StyleApply(key, code);
                } else {
                    throw new Error(`invalid style definition ${key}`)
                }
            }
        }
    }

    apply(scope: IScope, object: any) {
        console.log('>>>>>>>>>>>>>>>>>start 1')
        while (true) {
            let hasLeftOver = false;
            console.log('=============>> pass', object)
            const updated = forEachTreeObjectKey(object, (node: any, key: string, styles: any): boolean => {
                if (key.endsWith('^')) {
                    if (styles.length === 0) {
                        console.log('zero')
                        delete node[key];
                        return false;
                    }

                    const styleName = key.substr(0, key.length - 1);
                    console.log(styleName);
                    const leftOver = this.applyStyles(
                        scope, object,
                        node, styleName,
                        styles);
                    if (leftOver.length === 0) {
                        console.log('cleared')
                        delete node[key];
                        return true;
                    }

                    hasLeftOver = true;

                    if (leftOver.length === styles.length) {
                        console.log('in=', styles.length, 'leftover=', leftOver.length, "not updated", key, leftOver[0].name)
                        node[key] = leftOver;
                        return false;
                    }
                    console.log('leftover=', leftOver.length, 'updated')
                    return true;
                }
                return false;
            });
            console.log('DONE')

            if (!hasLeftOver)
                return;
            console.log(`updated = ${updated}, hasLeftOver=${hasLeftOver}`)
            if (!updated && hasLeftOver) {
                throw new Error('xxx');
            }
        }
    }
}
