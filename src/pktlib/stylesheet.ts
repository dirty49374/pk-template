import { IObject } from "../common";
import { CustomYamlTag } from "./utils";
import { IScope, IStyleSheet } from "./types";
import { StyleApply } from "./styleApply";

export class StyleSheet implements IStyleSheet {
    // constructor(private classes: { [id: string]: IClassHandler }) {
    private styleSheets: { [name: string]: StyleApply };
    constructor(private parent: IStyleSheet | null) {
        this.styleSheets = {};
    }

    applyStyles(scope: IScope, object: IObject, parent: object, styleType: string, styles: any): boolean {
        const style = this.styleSheets[styleType];
        if (style) {
            style.apply(scope, object, styles, parent);
            return true;
        }
        if (this.parent) {
            return this.parent.applyStyles(scope, object, parent, styleType, styles);
        }
        return false;
    }

    apply(scope: IScope, object: IObject, parent: object, styleName: string, params: any) {
        if (!this.applyStyles(scope, object, parent, styleName, params)) {
            throw new Error(`cannot found handler for style name '${styleName}'`);
        }
    }

    load(styles: object[]): any {
        for (const map of styles) {
            for (const key of Object.keys(map)) {
                const code = (map as any)[key];
                if (code instanceof CustomYamlTag) {
                    this.styleSheets[key] = new StyleApply(code);
                } else {
                    throw new Error(`invalid style definition ${key}`)
                }
            }
        }
    }
}
