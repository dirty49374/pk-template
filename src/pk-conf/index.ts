import { IValues } from "../pk-template";

export interface IPkProject {
    name: string;
    owner: string;
};

export interface IPkEnv {
    name: string;
    values: IValues;
}

export interface IPkApp {
    id: string;
    name: string;
    envs?: IPkEnv[];
}

export interface IPkModule {
    name: string;
    repository: string;
    branch?: string;
    tag?: string;
}

export interface IPkConf {
    project: IPkProject;
    apps: IPkApp[];
    envs: IPkEnv[];
    modules: IPkModule[];
}
