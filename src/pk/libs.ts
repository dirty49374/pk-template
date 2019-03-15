import { exceptionHandler } from '../pk-util/exception';
import { PkProjectConf } from '../pk-conf/projectConf';
import { IPkApp, IPkModule } from '../pk-conf';
import { normalize, join } from 'path';
import { MODULE_DIR } from '../pk-conf/module';

export const log = (...args: any) => console.log(...args);
export const tryCatch = async (cb: any, debug: boolean) => {
    try {
        await cb();
    } catch (e) {
        await exceptionHandler(e, debug);
    }
}

export const atProjectDir = async (cb: (root: string, conf: PkProjectConf) => Promise<any>) => {
    const { root, conf } = PkProjectConf.find();
    if (!root || !conf) {
        throw new Error(`cannot find ${PkProjectConf.FILENAME}`);
    }

    const cwd = process.cwd();
    process.chdir(root);

    try {
        await cb(root, conf);
        process.chdir(cwd);
    } catch (e) {
        process.chdir(cwd);
        throw e;
    }
}

export const atAppDir = async (conf: PkProjectConf, appName: string, cb: (app: IPkApp) => Promise<any>) => {
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


export const atModuleDir = async (conf: PkProjectConf, moduleName: string, cb: (module: IPkModule) => Promise<any>) => {
    const module = conf.getModule(moduleName);
    if (!module) {
        throw new Error(`module ${moduleName} does not exists`);
    }

    const cwd = process.cwd();
    try {
        const moduleDir = join(cwd, MODULE_DIR, moduleName);
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

export const getEnvNames = (conf: PkProjectConf, app: IPkApp) => {
    const envs: any = {};
    if (conf.data.envs) {
        for (const env of conf.data.envs) {
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
    cbb: (root: string, conf: PkProjectConf, app: IPkApp, envName: string) => Promise<any>) => {

    const cwd = process.cwd();
    const targetAppNames = (root: string, conf: PkProjectConf) => appName === '*'
        ? conf.data.apps.map(app => app.name)
        : (appName
            ? [appName as string]
            : [getCurrentDirectoryApp(conf.data.apps, root, cwd).name]);
    const targetEnvNames = (conf: PkProjectConf, app: IPkApp) => envName === '*'
        ? getEnvNames(conf, app)
        : [envName];


    await atProjectDir(async (root, conf) => {
        if (!conf.data.apps || conf.data.apps.length == 0) {
            throw new Error('no apps defined in pk-project.yaml');
        }
        const appNames = targetAppNames(root, conf);

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
