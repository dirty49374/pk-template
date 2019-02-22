import { IResourceType, IKubeCtlConfig } from "../common";

export interface IPkctlOptions {
    kubeconfig: string;
    context: string;
    cluster: string;
    packageName: string;
    _: string[];
    yes: boolean;
    dryRun: boolean;
}

export interface IPktCreateOptions extends IPkctlOptions {
}

export interface IPkctlUpdateOptions extends IPkctlOptions {
    packageNames: string[];
}

export interface IPkctlDiffOptions extends IPkctlOptions {
}

export interface IPkctlInitOptions extends IPkctlOptions {
}

export interface IPkctlAddOptions extends IPkctlOptions {
    repositoryName: string;
    repositoryUri: string;
}

export interface IPkctlApplyOptions extends IPkctlOptions {
    immediate: boolean;
    sequentialApply: boolean;
}

export interface ApplyConfig extends IKubeCtlConfig {
    target: string;
    apply: boolean;
    unnamespaced: IResourceType[];
    already_confirmed: boolean;
    // [ key: string ]: string;
}
