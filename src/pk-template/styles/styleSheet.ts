import { IObject, forEachTreeObjectKey } from "../../common";
import { IScope, IStyleSheet, IStyle, IPkt } from "../types";
import { StyleApply } from "./styleApply";
import { compileStyle } from "./styleCompile";
import { CustomYamlTag } from "../../pk-yaml/customTags";

export class StyleSheet implements IStyleSheet {
    private styleSheets: { [name: string]: StyleApply };

    constructor(private parent: IStyleSheet | null) {
        this.styleSheets = {};
    }

    private loadStyles(styles: object[]): any {
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

    private import(scope: IScope, rpath: string) {
        const { uri, data } = scope.loadPkt(rpath);
        scope.child({ uri }, cscope => {
            this.load(cscope, data);
        });
    }

    load(scope: IScope, pkt: IPkt) {
        if (pkt['/import']) {
            if (Array.isArray(pkt['/import'])) {
                for (let path of pkt['/import']) {
                    this.import(scope, path);
                }
            } else {
                this.import(scope, pkt['/import']);
            }
        }
        if (pkt['/style']) {
            this.loadStyles(pkt['/style']);
        }
    }

    applyStyle(scope: IScope, object: IObject, node: object, style: IStyle): boolean {
        const styleApply = this.styleSheets[style.type];
        return styleApply
            ? styleApply.applyStyle(scope, object, node, style)
            : (
                this.parent
                    ? this.parent.applyStyle(scope, object, node, style)
                    : false
            );
    }

    applyTree(scope: IScope, object: IObject) {
        let updated = false;

        let left: any = null;
        forEachTreeObjectKey(object, (node: any, key: string, styles: IStyle[]) => {
            if (key === '^') {
                if (styles.length === 0) {
                    delete node[key];
                    return;
                }

                const leftOvers: IStyle[] = [];
                for (const style of styles) {
                    const applied = this.applyStyle(scope, object, node, style);
                    if (applied) {
                        updated = true;
                    } else {
                        leftOvers.push(style);
                        left = style;
                    }
                }

                if (leftOvers.length == 0) {
                    delete node[key];
                } else {
                    node[key] = leftOvers;
                }
            }
        });

        if (!updated && left != null) {
            throw new Error(`cannot apply style ${left.type}`);
        }

        return left != null;
    }

    apply(scope: IScope, object: any) {
        compileStyle(scope, object);
        while (this.applyTree(scope, object))
            ;
    }

    static Build(scope: IScope, pkt: IPkt): StyleSheet {
        const styleSheet = new StyleSheet(scope.parent.styleSheet);
        styleSheet.load(scope, pkt);

        return styleSheet;
    }
}
