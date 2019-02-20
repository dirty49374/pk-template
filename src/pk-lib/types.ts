import { IObject } from "../common";

export type IConfig = any;
export interface IPkt {
    input: any;
    schema: any;
    import?: string[] | string;
    style: object[];
    assign: any;
    routine: any;
}

export type IStatement = any;
export type IUserdata = any;

export interface IValues {
    [id: string]: any;
}

export interface IOptions {
    argv: string[];
    cwd: string;
    stdin?: boolean;
    help?: boolean;
    version?: boolean;
    debug?: boolean;
    shellscript?: boolean;
    json?: boolean;
    json1?: boolean;
    pkt?: boolean;
    indent?: boolean;
    kubeconfig?: string;
    kubecluster?: string;
    kubecontext?: string;
    kubenamespace?: string;
    pkt_package?: string;
    pkt_package_update?: boolean;
    pkt_package_update_write?: boolean;
    bash?: boolean;
}

export type IScopeHandler = (scope: IScope) => any;

export interface IStyle extends Array<{ k: string, v: string, kv: string }> {
    type: string;
    name: string;
}

export class CustomYamlTag {
    constructor(public type: string, public code: string) { }
}


export interface IStyleSheet {
    applyStyle(scope: IScope, object: IObject, parent: object, styles: IStyle): boolean;
    apply(scope: IScope, orject: any): void;
    //   loadStyles(styles: object[]): void;
}

export interface ILoader {
    loadText(uri: string): { uri: string, data: string };
    loadYaml(uri: string): { uri: string, data: any };
    loadYamlAll(uri: string): { uri: string, data: any[] };

    loadPkt(uri: string): { uri: string, data: IPkt };
    loadTemplate(uri: string): { uri: string, data: string };
    listFiles(uri: string): { uri: string, data: string[] };
}

export interface IEvaluator {
    evalTemplate(tpl: string): string;
    evalTemplateAll(text: string): any[];

    evalCustomYamlTag(code: CustomYamlTag): any;
    evalScript(script: CustomYamlTag | string): any;

    evalAllCustomTags(node: any): any;
    expandCaretPath(object: any): void;
    evalObject(object: any): any;
}

export interface IScope {
    objects: IObject[];
    object: IObject | null;
    values: IValues;
    uri: string;
    parent: IScope;
    config: IConfig;
    userdata: any;
    $buildLib: any;
    styleSheet: IStyleSheet;

    resolve(relpath: string): string;
    add(object: any): void;
    child({ uri, objects, values }: any, handler: IScopeHandler): any;

    // loader
    loadText(uri: string): { uri: string, data: string };
    loadYaml(uri: string): { uri: string, data: any };
    loadYamlAll(uri: string): { uri: string, data: any[] };

    loadPkt(uri: string): { uri: string, data: IPkt };
    loadTemplate(uri: string): { uri: string, data: string };
    listFiles(uri: string): { uri: string, data: string[] };

    // evaluater
    evalTemplate(tpl: string): string;
    evalTemplateAll(text: string): any[];

    evalCustomYamlTag(code: CustomYamlTag): any;
    evalScript(script: CustomYamlTag | string): any;

    evalAllCustomTags(node: any): any;
    expandCaretPath(object: any): void;
    evalObject(object: any): any;

    // style
    expandStyle(orject: any): void;
}

export interface IPkz {
    name: string;
    args: string[];
    kubeconfig: string;
    context: string;
    cluster: string;
    objects: IObject[];
}
