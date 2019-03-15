import * as fs from "fs";
import { resolve, dirname } from "path";
import * as Yaml from '../pk-yaml';
import { IPkApp, IPkModule, IPkEnv, IPkProject, IPkConf } from ".";

export class PkConf implements IPkConf {
    static FILENAME = "pk-project.yaml";

    project: IPkProject;
    apps: IPkApp[];
    envs: IPkEnv[];
    modules: IPkModule[];

    constructor(file: IPkConf) {
        this.project = file.project;
        this.apps = file.apps;
        this.envs = file.envs;
        this.modules = file.modules;
    }

    addApp(app: IPkApp) {
        if (this.getApp(app.name)) {
            throw new Error(`app ${app.name} already exists`);
        }
        this.apps.push(app);
    }
    getApp = (name: string): IPkApp | undefined => this.apps.find(app => app.name == name);
    prepareEnv(envName: string) {
        if (!this.envs) {
            this.envs = [];
        }
        const env = this.envs.find(e => e.name == envName);
        if (env) {
            return env;
        }
        const newEnv = {
            name: envName,
            values: {},
        };
        this.envs.push(newEnv);
        return newEnv;
    }
    prepareAppEnv(appName: string, envName: string) {
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
        };
        app.envs.push(newEnv);
        return newEnv;
    }
    getMergedEnv(appName: string, envName: string): IPkEnv | undefined {
        const env = this.getEnv(envName);
        const app = this.getApp(appName);
        if (!app) {
            throw new Error(`app ${appName} not exits`);
        }
        const appEnv = app.envs && app.envs.find(e => e.name === envName);
        if (!env && !appEnv) {
            return undefined;
        }

        return {
            name: envName,
            values: {
                ...(env && env.values || {}),
                ...(appEnv && appEnv.values || {}),
            },
        } as IPkEnv
    }

    addEnv(env: IPkEnv) {
        if (this.getEnv(env.name)) {
            throw new Error(`env ${env.name} already exists`);
        }
        this.envs.push(env);
    }
    getEnv = (name: string): IPkEnv | undefined => this.envs && this.envs.find(e => e.name === name);

    addModule(module: IPkModule) {
        if (this.getModule(module.name)) {
            throw new Error(`module ${module.name} already exists`);
        }
        this.modules.push(module);
    }
    getModule = (name: string): IPkModule | undefined => this.modules.find(m => m.name == name);

    static exists() {
        return fs.existsSync(PkConf.FILENAME);
    }

    static create(projectName: string, owner: string) {
        return new PkConf({
            project: {
                name: projectName,
                owner: owner,
            },
            apps: [],
            envs: [],
            modules: [],
        });
    }

    static save(dir: string, file: IPkConf) {
        const data: IPkConf = {
            project: file.project,
            apps: file.apps || [],
            envs: file.envs || [],
            modules: file.modules || [],
        }
        const content = Yaml.dumpYaml(data);
        fs.writeFileSync(`${dir}/${PkConf.FILENAME}`, content, 'utf8');
    }

    private static tryLoad(uri: string): string | null {
        try {
            const json = fs.readFileSync(uri, 'utf8');
            return json;
        } catch (e) {
            return null;
        }
    }

    private static _find(dir: string) {
        while (true) {
            let path = resolve(dir, PkConf.FILENAME);
            const content = PkConf.tryLoad(path);
            if (content) {
                const file = Yaml.parseYaml(content);
                return {
                    path,
                    dir: dirname(path),
                    conf: new PkConf(file),
                };
            }
            const parent = resolve(dir, '../');
            if (parent == null || parent === dir) {
                return { path: null, file: null, dir: null };
            }

            dir = parent;
        }
    }

    static find(uri?: string) {
        return uri
            ? PkConf._find(uri + '/')
            : PkConf._find(process.cwd() + '/');
    }

}
