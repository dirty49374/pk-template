import { IObject } from "../common";
import { IPktArgs } from "../pkt/args";
import { IPkEnv } from "../pk-conf";
import { CustomYamlTag } from "../pk-yaml/customTags";

export type IConfig = any;
export interface IPkt {
    ['/properties']: any;
    ['/input']: any;         // depricated, use properties instead
    ['/schema']: any;
    ['/import']?: string[] | string;
    ['/style']: object[];
    ['/var']: any;
    ['/assign']: any;
    ['/routine']: any;
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
}

export type IScopeHandler = (scope: IScope) => any;

export interface IStyle extends Array<{ k: string, v: string, kv: string }> {
    type: string;
    name: string;
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

    // evalCustomYamlTag(code: CustomYamlTag): any;
    // evalScript(script: CustomYamlTag | string): any;

    evalAllCustomTags(node: any): any;
    expandCaretPath(object: any): void;
    evalObject(object: any): any;
}

export interface ITrace {
    into<T>(stepCb: () => T): T;
    step(name: string | number): void;
    pos(): string;
    depth(): number;
}

export interface IScope {
    objects: IObject[];
    object: IObject | null;
    values: IValues;
    value: any;
    pvalues: IValues;
    uri: string;
    parent: IScope;
    $buildLib: any;
    styleSheet: IStyleSheet;
    trace?: ITrace;

    resolve(relpath: string): string;
    add(object: any): void;
    child({ uri, objects }: any, handler: IScopeHandler): any;
    eval(tag: CustomYamlTag, additionalValues?: any): any;

    defineValues(values: IValues): void;
    assignValues(values: IValues): void;

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

    // evalCustomYamlTag(code: CustomYamlTag): any;
    // evalScript(script: CustomYamlTag | string): any;

    evalAllCustomTags(node: any): any;
    expandCaretPath(object: any): void;
    evalObject(object: any): any;

    // style
    expandStyle(orject: any): void;
}

export const PKMODULE_FILE_NAME = 'pkt.conf';
export const PKTLIBS_DIR_NAME = 'pktlib';

export interface IPktRepositories {
    [id: string]: string;
}

export interface IResult {
    args: IPktArgs;
    objects: IObject[];
}
