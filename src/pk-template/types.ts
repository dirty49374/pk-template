import { IObject } from "../common";
import { IPktArgs } from "../pkt/args";
import { IPkEnv } from "../pk-conf";
import { CustomYamlTag } from "../pk-yaml/customTags";

export type IConfig = any;
export interface IPktHeader {
    ['/properties']?: any;
    ['/schema']?: any;
    ['/import']?: string[] | string;
    ['/style']?: object[];
}

export interface IPkt {
    header: IPktHeader;
    statements: any[];
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
    applyStyle(vm: ILanguageVmBase, scope: IScope, object: IObject, parent: object, styles: IStyle): boolean;
    apply(vm: ILanguageVmBase, scope: IScope, orject: any): void;
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
    log(...args: any): void;
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
    trace: ITrace;

    resolve(relpath: string): string;
    add(object: any): void;
    child({ uri, objects }: any, handler: IScopeHandler): any;
    child2({ uri, objects, values, orphan }: any, handler: IScopeHandler): any;

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
    // evalTemplate(tpl: string): string;
    // evalTemplateAll(text: string): any[];

    // evalCustomYamlTag(code: CustomYamlTag): any;
    // evalScript(script: CustomYamlTag | string): any;

    // evalAllCustomTags(node: any, vm: ILanguageVmBase): any;
    // expandCaretPath(object: any): void;
    // evalObject(object: any, vm: ILanguageVmBase): any;

    // logging
    log(...args: any): void;

    error(msg: string, error?: Error): Error;
}

export interface IStatementSpec<T extends ILanguageRuntime> {
    name: string;
    mandotories?: string[];
    optionals?: string[];
    order: number;
    handler: (vm: ILanguageVm<T>, scope: IScope, stmt: any, netx: any) => IPkStatementResult;
}

export interface IStatementSpecs<T extends ILanguageRuntime> {
    [id: string]: IStatementSpec<T>;
}

export interface IPkStatementResult {
    exit?: boolean;
}

export interface ILanguageSpec<T extends ILanguageRuntime> {
    compile(scope: IScope, src: string, uri: string): any;
    initialState: string;
    states: {
        [state: string]: IStatementSpecs<T>;
    },
    sandbox(scope: IScope, values: IValues): any;
}

export interface ILanguageRuntime {
    createLanguageSpec(): any;
}

export interface ILanguageVmBase {
    eval(tag: CustomYamlTag, scope: IScope, values?: IValues): any;
    sandbox(scope: IScope, values?: IValues): any;
}

export interface ILanguageVm<T extends ILanguageRuntime> extends ILanguageVmBase {
    runtime: T;
    run(scope: IScope, path: string): void;
    execute(scope: IScope, stmt: any, state: string): IPkStatementResult;
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
