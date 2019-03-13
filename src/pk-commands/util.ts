import { PkConf } from "../pk-conf/conf";
import { IPkApp, IPkModule } from "../pk-conf";

export const atPkConfDir = async (cb: (root: string, conf: PkConf) => Promise<any>) => {
    const { dir, conf } = PkConf.find();
    if (!dir || !conf) {
        throw new Error(`cannot find ${PkConf.FILENAME}`);
    }

    const cwd = process.cwd();
    try {
        process.chdir(dir);
        await cb(dir, conf);
        process.chdir(cwd);
    } catch (e) {
        process.chdir(cwd);
        throw e;
    }
}

export const atAppDir = async (conf: PkConf, appName: string, cb: (app: IPkApp) => Promise<any>) => {
    const app = conf.getApp(appName);
    if (!app) {
        throw new Error(`app ${appName} does not exists`);
    }

    const cwd = process.cwd();
    try {
        process.chdir(`${appName}`);
        await cb(app);
        process.chdir(cwd);
    } catch (e) {
        process.chdir(cwd);
        throw e;
    }
}


export const atModuleDir = async (conf: PkConf, moduleName: string, cb: (module: IPkModule) => Promise<any>) => {
    const module = conf.getModule(moduleName);
    if (!module) {
        throw new Error(`module ${moduleName} does not exists`);
    }

    const cwd = process.cwd();
    try {
        process.chdir(`${moduleName}`);
        await cb(module);
        process.chdir(cwd);
    } catch (e) {
        process.chdir(cwd);
        throw e;
    }
}
