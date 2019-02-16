import { IObject } from "../common";
import { CustomYamlTag } from "./utils";
import { IScope, IStyleSheet } from "./types";

export class Styler {
    constructor(private code: CustomYamlTag) { }
    apply(scope: IScope, object: IObject, className: string, parameters: any, parent: object) {

    }
}

const _setValue = (node: any, pathes: string[], value: any) => {
    if (true) {
        const key = pathes[0];
        if (pathes.length == 1) {
            node[key] = value;
        } else {
            const child = key in node ? node[key] : (node[key] = {});
            pathes.shift();
            _setValue(child, pathes, value);
        }
    }
}

const setValue = (node: any, path: string, value: any) => {
    _setValue(node, path.split('.'), value);
}

export interface IClassMap {
    [name: string]: Styler
}

export interface IStyle {
    name: string;
    styler: IStyle;
}

export class StyleSheet implements IStyleSheet {
    // constructor(private classes: { [id: string]: IClassHandler }) {
    private styleSheets: { [name: string]: Styler };
    constructor(private parent: IStyleSheet) {
        this.styleSheets = {};
    }

    expandClass(scope: IScope, object: IObject, parent: object, styleName: string, params: any): boolean {
        const style = this.styleSheets[styleName];
        if (style) {
            style.apply(scope, object, styleName, params, parent);
            return true;
        }
        if (this.parent) {
            return this.parent.expandClass(scope, object, parent, styleName, params);
        }
        return false;
    }

    apply(scope: IScope, object: IObject, parent: object, styleName: string, params: any) {
        if (!this.expandClass(scope, object, parent, styleName, params)) {
            throw new Error(`cannot found handler for style name '${styleName}'`);
        }
    }

    load(styles: object[]): any {
        for (const map of styles) {
            console.log(styles);
            for (const key of Object.keys(map)) {
                const code = (map as any)[key];
                if (code instanceof CustomYamlTag) {
                    this.styleSheets[key] = new Styler(code);
                } else {
                    throw new Error(`invalid style definition ${key}`)
                }
            }
        }
    }
}
