import { IPktArgs } from "../pkt/args";
import { IObject } from "../common";
import { IPkEnv, IPkProject, IPkApp } from "../pk-conf";

export interface IPkDeploymentHeader {
  id: string;
  name: string;
  created: string;
  project: IPkProject;
  app: IPkApp;
  env: string;
  cluster: string;
}

export interface IPkDeployment {
  header: IPkDeploymentHeader;
  objects: IObject[];
}
