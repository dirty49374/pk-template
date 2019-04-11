import { resolve, dirname, join } from "path";
import * as Yaml from '../pk-yaml';
import { IPkApp, IPkModule, IPkEnv, IPkProject, IPkProjectConf } from ".";
import { existsSync, writeFileSync, readFileSync } from "fs";

export class PkProjectConf {
  static FILENAME = "pk-project.yaml";

  constructor(public data: IPkProjectConf) {
  }

  addApp(app: IPkApp) {
    if (this.getApp(app.name)) {
      throw new Error(`app ${app.name} already exists`);
    }
    this.data.apps.push(app);
  }
  getApp = (name: string): IPkApp | undefined => this.data.apps.find(app => app.name == name);
  prepareEnv(envName: string): IPkEnv {
    if (!this.data.envs) {
      this.data.envs = [];
    }
    const env = this.data.envs.find(e => e.name == envName);
    if (env) {
      return env;
    }
    const newEnv = {
      name: envName,
      values: {},
      clusters: [],
    };
    this.data.envs.push(newEnv);
    return newEnv;
  }
  prepareAppEnv(appName: string, envName: string): IPkEnv {
    const app = this.getApp(appName);
    if (!app) {
      throw new Error(`app ${appName} does not exists`);
    }
    if (!app.envs) {
      app.envs = [];
    }
    const env = app.envs.find(e => e.name == envName);
    if (env) {
      return env;
    }
    const newEnv = {
      name: envName,
      values: {},
      clusters: [],
    };
    app.envs.push(newEnv);
    return newEnv;
  }
  getMergedEnv(appName: string, envName: string, clusterName: string): IPkEnv | undefined {
    const app = this.getApp(appName);
    if (!app) {
      throw new Error(`app ${appName} not exits`);
    }

    const env = app.envs
      ? app.envs.find(e => e.name === envName)
      : this.getEnv(envName);

    if (!env) {
      return undefined;
    }

    if (!env.clusters.includes(clusterName)) {
      return undefined;
    }

    return {
      ...(env || {}),
      values: {
        ...(this.data.values || {}),
        ...(env && env.values || {}),
      },
    } as IPkEnv
  }

  addEnv(env: IPkEnv) {
    if (this.getEnv(env.name)) {
      throw new Error(`env ${env.name} already exists`);
    }
    this.data.envs.push(env);
  }
  getEnv = (name: string): IPkEnv | undefined => this.data.envs && this.data.envs.find(e => e.name === name);

  addModule(module: IPkModule) {
    if (this.getModule(module.name)) {
      throw new Error(`module ${module.name} already exists`);
    }
    this.data.modules.push(module);
  }
  upsertModule(module: IPkModule) {
    const idx = this.data.modules.findIndex(m => m.name == module.name);
    if (idx >= 0) {
      this.data.modules[idx] = module;
    } else {
      this.addModule(module);
    }
  }
  getModule = (name: string): IPkModule | undefined => this.data.modules.find(m => m.name == name);

  isDeployExecutable(branch: string | undefined, appName: string, envName: string, clusterName: string): boolean {
    if (!branch || !this.data.deploy || this.data.deploy.length === 0) {
      return true;
    }

    const deployConfs = this.data.deploy.filter(d => d.branch === branch);
    if (deployConfs.length === 0) {
      return false;
    }

    const accepted = (accpets: string[] | undefined, denies: string[] | undefined, item: string, name: string): boolean => {
      if (accpets && denies) {
        throw new Error(`deploy option ${name} and -${name} can not be used at the same time.`)
      }

      if (accpets) {
        return accpets.includes(item);
      } else if (denies) {
        return !denies.includes(item);
      } else { // both not exists
        return true;
      }
    }

    return deployConfs.some(conf => accepted(conf.apps, conf['-apps'], appName, 'apps')
      && accepted(conf.envs, conf['-envs'], envName, 'envs')
      && accepted(conf.clusters, conf['-clusters'], clusterName, 'clusters'))
  }

  static exists(dir?: string) {
    return dir
      ? existsSync(join(dir, PkProjectConf.FILENAME))
      : existsSync(PkProjectConf.FILENAME);
  }

  static create(projectName: string, owner: string) {
    return new PkProjectConf({
      project: {
        name: projectName,
        owner: owner,
      },
      values: {},
      apps: [],
      envs: [],
      modules: [],
      deploy: [],
    });
  }

  static save(conf: PkProjectConf, dir: string) {
    const content = Yaml.dumpYaml(conf.data);
    writeFileSync(`${dir}/${PkProjectConf.FILENAME}`, content, 'utf8');
  }

  private static tryLoad(uri: string): string | null {
    try {
      const json = readFileSync(uri, 'utf8');
      return json;
    } catch (e) {
      return null;
    }
  }

  private static _find(dir: string) {
    while (true) {
      let projectPath = resolve(dir, PkProjectConf.FILENAME);
      const content = PkProjectConf.tryLoad(projectPath);
      if (content) {
        const file = Yaml.parseYaml(content);
        return {
          projectPath,
          projectRoot: dirname(projectPath),
          projectConf: new PkProjectConf(file),
        };
      }
      const parent = resolve(dir, '../');
      if (parent == null || parent === dir) {
        return { projectPath: null, projectConf: null, projectRoot: null };
      }

      dir = parent;
    }
  }

  static find(uri?: string) {
    return uri
      ? PkProjectConf._find(uri + '/')
      : PkProjectConf._find(process.cwd() + '/');
  }

}
