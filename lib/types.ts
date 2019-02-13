export interface IValues {
    [ id: string ]: any;
}

export interface IObject {
    [ id: string ]: any;
}

export interface IOptions {
    [ id: string ]: any;
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
