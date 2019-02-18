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

export interface IStyle extends Array<{ k: string, v: string }> {
    name: string;
}


export interface IStyleSheet {
    applyStyles(scope: IScope, object: IObject, parent: object, styleType: string, styles: IStyle[]): IStyle[];
    apply(scope: IScope, orject: any): void;
    load(styles: object[]): void;
}

export interface IScope {
    objects: IObject[];
    object: IObject | null;
    values: IValues;
    uri: string;
    parent: IScope;
    styleSheet: IStyleSheet;
    config: IConfig;
    userdata: any;
    $buildLib: any;

    resolve(relpath: string): string;
    add(object: any): void;
    child({ uri, objects, values }: any, handler: IScopeHandler): any;
}
