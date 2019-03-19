import { exceptionHandler } from '../pk-util/exception';
import { PkProjectConf } from '../pk-conf/projectConf';
import { IPkApp, IPkModule } from '../pk-conf';
import { normalize, join } from 'path';
import { MODULE_DIR } from '../pk-conf/module';
import { homedir } from 'os';
import { preserveDir } from '../pk-util/preserveDir';
import { getInquirer, getChalk, getUnderscore } from '../lazy';
import { exec as child_process_exec } from "child_process";
import { template } from 'underscore';
import { readFileSync } from 'fs';

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

    await atDir(home, async () => {
        await cb(home);
    });
}

export const atDir = async (dir: string, cb: (dir: string) => Promise<any>) => {
    await preserveDir(async () => {
        process.chdir(dir);
        await cb(dir);
    });
}

export const atProjectDir = async (cb: (projectRoot: string, projectConf: PkProjectConf) => Promise<any>) => {
    const { projectRoot, projectConf } = PkProjectConf.find();
    if (!projectRoot || !projectConf) {
        throw new Error(`cannot find ${PkProjectConf.FILENAME}`);
    }

    await atDir(projectRoot, async () => {
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

    await atDir(join(projectRoot, appName), async () => {
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

    await atDir(join(projectRoot, MODULE_DIR, moduleName), async () => {
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

export const prompt = async (inq: any): Promise<any> => {
    return await getInquirer().prompt(inq);
}

export const promptStart = (msg: string) => {
    console.log(getChalk().grey(`  ${msg} ...`));
}

export const promptSkip = () => {
    console.log(getChalk().grey('  skipped !!!'));
}

export const promptSuccess = (msg: string) => {
    console.log(getChalk().grey(`  ${msg} !!!`));
}

export const tpl = (file: string) => {
    const _ = getUnderscore();
    const tpl = readFileSync(file, 'utf8');
    return _.template(tpl);
}

export const exec = async (command: string) => {
    console.log(getChalk().grey(`  * exec: ${command}`));
    return new Promise((resolve, reject) => {
        try {
            const ps = child_process_exec(command);
            process.stdout.write('  ');
            const cb = (data: string) => {
                const indented = data.replace(/\n/g, '\n  ');
                process.stdout.write(getChalk().grey(indented));
            }
            ps.stdout.on('data', cb);
            ps.stderr.on('data', cb);
            ps.on('close', code => {
                console.log();
                if (code == 0) {
                    resolve();
                }
                reject(new Error(`process exited with code = ${code}`));
            });
        } catch (e) {
            reject(e);
        }
    });
}
