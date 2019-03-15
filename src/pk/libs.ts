import { exceptionHandler } from "../pk-util/exception";
import { PkConf } from "../pk-conf/conf";
import { IPkApp, IPkModule } from "../pk-conf";
import { normalize, join } from "path";
import { exec } from "child_process";

export const log = (...args: any) => console.log(...args);
export const tryCatch = async (cb: any) => {
    try {
        await cb();
    } catch (e) {
        await exceptionHandler(e);
    }
}

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
        const moduleDir = cwd + `/pk_modules/${moduleName}`;
        process.chdir(moduleDir);
        await cb(module);
        process.chdir(cwd);
    } catch (e) {
        process.chdir(cwd);
        throw e;
    }
}


export const getCurrentDirectoryApp = (apps: IPkApp[], root: string, cwd: string) => {
    const app = apps.find(app => normalize(cwd) === normalize(join(root, app.name)));
    if (!app) {
        throw new Error('please specify app anme');
    }
    return app;
}

export const getEnvNames = (conf: PkConf, app: IPkApp) => {
    const envs: any = {};
    if (conf.envs) {
        for (const env of conf.envs) {
            envs[env.name] = true;
        }
    }
    if (app.envs) {
        for (const env of app.envs) {
            envs[env.name] = true;
        }
    }
    return Object.keys(envs);
}

export const visitEachAppAndEnv = async (
    appName: string | undefined | null,
    envName: string,
    cbb: (root: string, conf: PkConf, app: IPkApp, envName: string) => Promise<any>) => {

    const cwd = process.cwd();
    const targetAppNames = (root: string, conf: PkConf) => appName === '*'
        ? conf.apps.map(app => app.name)
        : (appName
            ? [appName as string]
            : [getCurrentDirectoryApp(conf.apps, root, cwd).name]);
    const targetEnvNames = (conf: PkConf, app: IPkApp) => envName === '*'
        ? getEnvNames(conf, app)
        : [envName];


    await atPkConfDir(async (root, conf) => {
        const appNames = targetAppNames(root, conf);
        if (appNames.length == 0) {
            throw new Error('please specify app-name or use --all-apps option');
        }

        for (const appName of appNames) {
            await atAppDir(conf, appName, async app => {
                const envNames = targetEnvNames(conf, app);
                if (envNames.length == 0) {
                    throw new Error('please specify env-name or use --all-envs option');
                }

                for (const envName of envNames) {
                    await cbb(root, conf, app, envName);
                }
            });
        }
    });

}
