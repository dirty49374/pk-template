import { IObject } from "../common";
import { IPktArgs } from "../pkt/args";

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

export interface IPktOptions {
    stdin?: boolean;
    help?: boolean;
    version?: boolean;
    debug?: boolean;
    json?: boolean;
    json1?: boolean;
    pkt?: boolean;
    indent?: boolean;
    env?: string;
    spec?: string;
}

export type IScopeHandler = (scope: IScope) => any;

export interface IStyle extends Array<{ k: string, v: string, kv: string }> {
    type: string;
    name: string;
}

export class CustomYamlTag {
    constructor(public type: string, public code: string, public uri: string) { }
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

export interface ITrace {
    into<T>(stepCb: () => T): T;
    step(name: string | number): void;
    pos(): string;
}

export interface IScope {
    objects: IObject[];
    object: IObject | null;
    values: IValues;
    uri: string;
    parent: IScope;
    $buildLib: any;
    styleSheet: IStyleSheet;
    trace?: ITrace;

    resolve(relpath: string): string;
    add(object: any): void;
    child({ uri, objects, values }: any, handler: IScopeHandler): any;
    eval(src: string, uri?: string, additionalValues?: any): any;

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
    args: IPktArgs;
    context: string;
    objects: IObject[];
}

export const PKMODULE_FILE_NAME = 'pkt.conf';
export const PKTLIBS_DIR_NAME = 'pktlib';

export interface IPktRepositories {
    [id: string]: string;
}

export interface IPktEnv {
    name: string;
    context: string;
    data: { [id: string]: any; };
}

export interface IResult {
    objects: IObject[];
    args: IPktArgs;
    env: IPktEnv | null;
}