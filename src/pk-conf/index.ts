import { IValues } from "../pk-template";

export interface IPkProject {
  name: string;
  owner: string;
};

export interface IPkEnv {
  name: string;
  branch?: string;
  values: IValues;
  clusters: string[];
}

export interface IPkApp {
  id: string;
  name: string;
  envs?: IPkEnv[];
  owner?: string;
  namespace?: string;
}

export interface IPkModule {
  name: string;
  repository: string;
  branch?: string;
  tag?: string;
}

export interface IPkDeployConf {
  branch: string;
  apps?: string[];
  '-apps'?: string[];
  envs?: string[];
  '-envs'?: string[];
  clusters?: string[];
  '-clusters'?: string[];
}

export interface IPkProjectConf {
  project: IPkProject;
  values: IValues;
  apps: IPkApp[];
  envs: IPkEnv[];
  modules: IPkModule[];
  namespace?: string;
  deploy?: IPkDeployConf[]
}

export interface IPkConf {
  email: string;
  modules: IPkModule[];
  repositories: IPkModule[];
}
