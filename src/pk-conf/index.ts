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
    owner?: string;
}

export interface IPkModule {
    name: string;
    repository: string;
    branch?: string;
    tag?: string;
}

export interface IPkProjectConf {
    project: IPkProject;
    values: IValues;
    apps: IPkApp[];
    envs: IPkEnv[];
    modules: IPkModule[];
    namespace?: string;
}

export interface IPkConf {
    email: string;
    modules: IPkModule[];
    repositories: IPkModule[];
}
