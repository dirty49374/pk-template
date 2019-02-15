export type IConfig = any;
export type IPkt = any;

export type IStatement = any;
export type IUserdata = any;

export interface IValues {
    [ id: string ]: any;
}

export interface IObject {
    [ id: string ]: any;
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

export interface IScope {
    objects: IObject[];
    object: IObject | null;
    values: IValues;
    uri: string;
    parent: IScope;
    config: IConfig;
    userdata: any;
    $buildLib: any;

    resolve(relpath: string): string;
    add(object: any): void;
    child({ uri, objects, values }: any, handler: IScopeHandler): any;
}
