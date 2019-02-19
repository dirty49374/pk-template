import { IObject, forEachTreeObjectKey } from "../../common";
import { IScope, IStyleSheet, IStyle } from "../types";
import { CustomYamlTag } from '../../pk-yaml';
import { StyleApply } from "./styleApply";

export class StyleSheet implements IStyleSheet {
    private styleSheets: { [name: string]: StyleApply };

    constructor(private parent: IStyleSheet | null) {
        this.styleSheets = {};
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

    applyStyles(scope: IScope, object: IObject, node: object, styleType: string, styles: IStyle[]): IStyle[] {
        const styleApply = this.styleSheets[styleType];
        if (styleApply) {
            return styleApply.apply(scope, object, node, styleType, styles);
        }
        if (this.parent) {
            return this.parent.applyStyles(scope, object, node, styleType, styles);
        }
        return styles;
    }

    applyStyle(scope: IScope, object: IObject, node: object, styleType: string, style: IStyle): boolean {
        const styleApply = this.styleSheets[styleType];
        if (styleApply) {
            return styleApply.applyStyle(scope, object, node, style);
        }
        if (this.parent) {
            return this.parent.applyStyle(scope, object, node, styleType, style);
        }
        return false;
    }

    apply(scope: IScope, object: any) {
        while (true) {
            let hasLeftOver = false;
            let updated = false;

            forEachTreeObjectKey(object, (node: any, key: string, styles: any) => {
                if (key.endsWith('^')) {
                    if (key.length === 1) {
                        if (styles.length === 0) {
                            delete node[key];
                            return;
                        }

                        const leftOver: any[] = [];
                        for (const st of styles) {
                            const styleType = st.type;
                            const style = st.style;

                            const applied = this.applyStyle(scope, object, node, styleType, style);
                            if (!applied) {
                                leftOver.push(st);
                                hasLeftOver = true;
                            } else {
                                updated = true;
                            }
                        }
                        if (leftOver.length == 0) {
                            delete node[key];
                        } else {
                            node[key] = leftOver;
                        }
                    } else {
                        if (styles.length === 0) {
                            delete node[key];
                            return;
                        }

                        const styleName = key.substr(0, key.length - 1);
                        const leftOver = this.applyStyles(
                            scope, object,
                            node, styleName,
                            styles);
                        if (leftOver.length === 0) {
                            updated = true;
                            delete node[key];
                            return;
                        }

                        hasLeftOver = true;

                        if (leftOver.length === styles.length) {
                            node[key] = leftOver;
                            return;
                        }
                        updated = true;
                    }
                }
            });

            if (!updated && hasLeftOver) {
                throw new Error('xxx');
            }

            if (!hasLeftOver)
                return;
        }
    }
}
