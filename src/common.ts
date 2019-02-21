export interface IPkzHeader {
    kubeconfig: string;
    context: string;
    cluster: string;
}

export interface IObject {
    [id: string]: any;
}

export interface IKubeCtlConfig extends IPkzHeader {
    kube_dryrun_option: string;
    kube_option: string;
    sequential_apply: boolean;
}

export interface IProgress {
    header(message: string): void;
    confirm(msg: string): void;
    info(msg?: string): void;
    output(msg?: string): void;
    verbose(msg?: string): void;
    success(msg?: string): void;
    warning(msg?: string): void;
    error(msg?: string): void;
}


export interface IResourceType {
    apiGroup: string;
    kind: string;
}

export interface IResourceKey {
    kind: string;
    apiGroup: string;
    namespace: string;
    name: string;
}

export interface ISet {
    [id: string]: boolean;
}

export const delay = (ms: number): Promise<any> =>
    new Promise(resolve => setTimeout(() => resolve(), ms));


export type TreeNodeKeyVisitor = (object: any, key: string, value: any) => void;

export const forEachTreeObjectKey = (object: any, cb: TreeNodeKeyVisitor) => {
    if (Array.isArray(object)) {
        for (const item of object) {
            forEachTreeObjectKey(item, cb);
        }
    } else if (typeof object === 'object') {
        if (object === null) return;
        for (const key of Object.keys(object)) {
            const value = object[key];
            forEachTreeObjectKey(value, cb);
            cb(object, key, value);
        }
    }
}

export type TreeNodeVisitor = (object: any) => void;
export const forEachTreeObject = (object: any, cb: TreeNodeVisitor) => {
    if (Array.isArray(object)) {
        for (const item of object) {
            forEachTreeObject(item, cb);
        }
    } else if (typeof object === 'object') {
        if (object === null) return;
        for (const key of Object.keys(object)) {
            const value = object[key];
            forEachTreeObject(value, cb);
        }
        cb(object);
    }
}

export const version = () => require(__dirname + '/../package.json').version;
