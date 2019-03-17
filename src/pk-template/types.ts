import { IObject } from "../common";
import { IPktArgs } from "../pkt/args";
import { IPkEnv } from "../pk-conf";

export type IConfig = any;
export interface IPkt {
    input: any;
    schema: any;
    import?: string[] | string;
    style: object[];
    var: any;
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
}

export type IScopeHandler = (scope: IScope) => any;

export interface IStyle extends Array<{ k: string, v: string, kv: string }> {
    type: string;
    name: string;
}

export class CustomYamlTag {
    constructor(public type: string, public code: string, public src: string, public uri: string) { }
    represent = () => this.src;
    isScript = () => false;

}
export class CustomYamlJsTag extends CustomYamlTag {
    constructor(code: string, src: string, uri: string) { super('js', code, src, uri); }
    isScript = () => true;
}
export class CustomYamlCsTag extends CustomYamlTag {
    constructor(code: string, src: string, uri: string) { super('cs', code, src, uri); }
    isScript = () => true;
}
export class CustomYamlLsTag extends CustomYamlTag {
    constructor(code: string, src: string, uri: string) { super('ls', code, src, uri); }
    isScript = () => true;
}
export class CustomYamlTemplateTag extends CustomYamlTag {
    constructor(code: string, src: string, uri: string) { super('template', code, src, uri); }
}
export class CustomYamlFileTag extends CustomYamlTag {
    constructor(code: string, src: string, uri: string) { super('file', code, src, uri); }
}
export class CustomYamlTagTag extends CustomYamlTag {
    constructor(code: string, src: string, uri: string) { super('tag', code, src, uri); }
    convert() {
        const [tag, src] = this.src.split(' ', 2);
        switch (tag) {
            case '!js': return new CustomYamlJsTag(src, src, this.uri);
            case '!ls': return new CustomYamlLsTag(src, src, this.uri);
            case '!cs': return new CustomYamlCsTag(src, src, this.uri);
            case '!template': return new CustomYamlTemplateTag(src, src, this.uri);
            case '!file': return new CustomYamlFileTag(src, src, this.uri);
        }
    }
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
    eval(src: string, uri?: string, additionalValues?: any): any;
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

    evalCustomYamlTag(code: CustomYamlTag): any;
    evalScript(script: CustomYamlTag | string): any;

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
