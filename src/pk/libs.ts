import { exceptionHandler } from '../pk-util/exception';
import { PkProjectConf } from '../pk-conf/projectConf';
import { IPkApp, IPkModule } from '../pk-conf';
import { normalize, join } from 'path';
import { MODULE_DIR } from '../pk-conf/module';
import { homedir } from 'os';
import { preserveDir } from '../pk-util/preserveDir';

export const log = (...args: any) => console.log(...args);
export const tryCatch = async (cb: any, debug: boolean) => {
    try {
        await cb();
    } catch (e) {
        await exceptionHandler(e, debug);
    }
}

export const atHomeDir = async (cb: (homedir: string) => Promise<any>) => {
    const home = homedir();

    await preserveDir(async () => {
        process.chdir(home);
        await cb(home);
    });
}

export const atProjectDir = async (cb: (projectRoot: string, projectConf: PkProjectConf) => Promise<any>) => {
    const { projectRoot, projectConf } = PkProjectConf.find();
    if (!projectRoot || !projectConf) {
        throw new Error(`cannot find ${PkProjectConf.FILENAME}`);
    }

    await preserveDir(async () => {
        process.chdir(projectRoot);
        await cb(projectRoot, projectConf);
    });
}

export const atAppDir = async (appName: string, cb: (app: IPkApp) => Promise<any>) => {
    const { projectRoot, projectConf } = PkProjectConf.find();
    if (!projectRoot || !projectConf) {
        throw new Error(`cannot find ${PkProjectConf.FILENAME}`);
    }

    const app = projectConf.getApp(appName);
    if (!app) {
        throw new Error(`app ${appName} does not exists`);
    }

    await preserveDir(async () => {
        process.chdir(join(projectRoot, appName));
        await cb(app);
    });
}

export const atModuleDir = async (moduleName: string, cb: (module: IPkModule) => Promise<any>) => {
    const { projectRoot, projectConf } = PkProjectConf.find();
    if (!projectRoot || !projectConf) {
        throw new Error(`cannot find ${PkProjectConf.FILENAME}`);
    }

    const module = projectConf.getModule(moduleName);
    if (!module) {
        throw new Error(`module ${moduleName} does not exists`);
    }

    await preserveDir(async () => {
        process.chdir(join(projectRoot, MODULE_DIR, moduleName));
        await cb(module);
    });
}

export const getCurrentDirectoryApp = (apps: IPkApp[], root: string, cwd: string) => {
    const app = apps.find(app => normalize(cwd) === normalize(join(root, app.name)));
    if (!app) {
        throw new Error('please specify app anme');
    }
    return app;
}

export const getEnvNames = (projectConf: PkProjectConf, app: IPkApp) => {
    const envs: any = {};
    if (projectConf.data.envs) {
        for (const env of projectConf.data.envs) {
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
    cbb: (projectRoot: string, projectConf: PkProjectConf, app: IPkApp, envName: string) => Promise<any>) => {

    const cwd = process.cwd();
    const targetAppNames = (projectRoot: string, projectConf: PkProjectConf) => appName === '*'
        ? projectConf.data.apps.map(app => app.name)
        : (appName
            ? [appName as string]
            : [getCurrentDirectoryApp(projectConf.data.apps, projectRoot, cwd).name]);
    const targetEnvNames = (projectConf: PkProjectConf, app: IPkApp) => envName === '*'
        ? getEnvNames(projectConf, app)
        : [envName];


    await atProjectDir(async (projectRoot, projectConf) => {
        if (!projectConf.data.apps || projectConf.data.apps.length == 0) {
            throw new Error('no apps defined in pk-project.yaml');
        }
        const appNames = targetAppNames(projectRoot, projectConf);

        for (const appName of appNames) {
            await atAppDir(appName, async app => {
                const envNames = targetEnvNames(projectConf, app);
                if (envNames.length == 0) {
                    throw new Error('please specify env-name or use --all-envs option');
                }

                for (const envName of envNames) {
                    await cbb(projectRoot, projectConf, app, envName);
                }
            });
        }
    });

}
