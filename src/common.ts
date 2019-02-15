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
