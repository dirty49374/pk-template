import { IResourceType, IKubeCtlConfig } from '../common';
import { IProgressOptions } from '../pk-ui';

export type IPkCommandInfo = any;

export interface IPkctlOptions extends IProgressOptions {
    context: string;
    packageName: string;
    _: string[];
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

export interface IPkctlDeleteOptions extends IPkctlOptions {
    envName: string;
}

export interface IPkctlDeployOptions extends IPkctlOptions {
    specName: string;
    envName: string;
    immediate: boolean;
    sequentialApply: boolean;
}

export interface IPkctlEnvOptions extends IPkctlOptions {
    envName: string;
    contextName: string;
}


export interface ApplyConfig extends IKubeCtlConfig {
    target: string;
    apply: boolean;
    unnamespaced: IResourceType[];
    already_confirmed: boolean;
    // [ key: string ]: string;
}
