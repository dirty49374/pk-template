import * as fs from "fs";
import { resolve, dirname } from "path";
import * as Yaml from '../pk-yaml';
import { v4 as uuid } from 'uuid';
import { IPkModule } from "../pk-module/PkModuleHelper";

export interface IPkProject {
    id: string
    name: string;
    owner: string;
};

export interface IPkApp {
    id: string;
    name: string;
    path: string;
}

export interface IPkEnv {
    name: string;
    context: string;
    data: { [id: string]: any; };
}

export interface IPkProjectFile {
    project: IPkProject;
    apps: IPkApp[];
    envs: IPkEnv[];
    modules: IPkModule[];
}

export class PkProjectFile implements IPkProjectFile {
    static FILENAME = "pk.conf";

    project: IPkProject;
    apps: IPkApp[];
    envs: IPkEnv[];
    modules: IPkModule[];

    constructor(file: IPkProjectFile) {
        this.project = file.project;
        this.apps = file.apps;
        this.envs = file.envs;
        this.modules = file.modules;
    }
    addModule(module: IPkModule) {
        if (this.modules.findIndex(m => m.name == module.name) >= 0) {
            throw new Error(`module ${module.name} already exists`);
        }
        this.modules.push(module);
    }

    getModule(name: string) {
        return this.modules.find(m => m.name == name);
    }

    static exists() {
        return fs.existsSync(PkProjectFile.FILENAME);
    }

    static create(projectName: string, owner: string) {
        return new PkProjectFile({
            project: {
                id: uuid(),
                name: projectName,
                owner: owner,
            },
            apps: [],
            envs: [],
            modules: [],
        });
    }

    static save(dir: string, file: IPkProjectFile) {
        const content = Yaml.dumpYaml(file);
        fs.writeFileSync(`${dir}/${PkProjectFile.FILENAME}`, content, 'utf8');
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
            let path = resolve(dir, PkProjectFile.FILENAME);
            const content = PkProjectFile.tryLoad(path);
            if (content) {
                const file = Yaml.parseYaml(content);
                return {
                    path,
                    dir: dirname(path),
                    conf: new PkProjectFile(file),
                };
            }
            const parent = resolve(dir, '../');
            if (parent == null || parent === path) {
                return { path: null, file: null, dir: null };
            }

            dir = parent;
        }
    }

    static find(uri?: string) {
        return uri
            ? PkProjectFile._find(uri + '/')
            : PkProjectFile._find(process.cwd() + '/');
    }

}
