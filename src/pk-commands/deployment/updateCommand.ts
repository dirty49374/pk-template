import { execCommand, generate } from '../../pkt/pkt';
import { join, normalize } from 'path';
import { getChalk, getReadlineSync } from '../../lazy';
import { buildPkd } from '../../pk-deploy/build';
import { savePkd } from '../../pk-deploy/save';
import { existsPkd } from '../../pk-deploy/exists';
import { PkConf } from '../../pk-conf/conf';
import { atPkConfDir, atAppDir } from '../util';
import { loadPkd } from '../../pk-deploy/load';
import { diffObjects } from '../../pk-diff/diff-objects';
import { IPkApp, IPkConf } from '../../pk-conf';

const update = async (conf: PkConf, appName: string, envName: string, options: any) => {
    const oldDeployment = loadPkd(envName);
    const newDeployment = await buildPkd(conf, appName, envName);

    return newDeployment;
}

const getCurrentDirectoryApp = (apps: IPkApp[], root: string, cwd: string) => {
    const app = apps.find(app => normalize(cwd) === normalize(join(root, app.name)));
    if (!app) {
        throw new Error('please specify app anme');
    }
    return app;
}

const getEnvNames = (conf: IPkConf, app: IPkApp) => {
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

export default {
    command: 'update [appName]',
    desc: 'update a deployment for environment',
    builder: (yargs: any) => yargs
        .option('env', { describe: 'environment name' })
        .option('all', { describe: 'update all apps and envs', boolean: true })
        .option('all-apps', { describe: 'update all apps', boolean: true })
        .option('all-envs', { describe: 'update all environments', boolean: true })
        .option('yes', { describe: 'overwrite without confirmation', boolean: true }),
    handler: async (argv: any): Promise<any> => {

        const cwd = process.cwd();
        await atPkConfDir(async (root, conf) => {

            const appNames = argv.all || argv.allApps
                ? conf.apps.map(app => app.name)
                : (argv.appName
                    ? [argv.appName as string]
                    : [getCurrentDirectoryApp(conf.apps, root, cwd).name]
                );
            if (appNames.length == 0) {
                throw new Error('please specify app-name or use --all-apps option');
            }

            for (const appName of appNames) {

                await atAppDir(conf, appName, async app => {

                    const envNames = argv.all || argv.allEnvs
                        ? getEnvNames(conf, app)
                        : [argv.env];
                    if (envNames.length == 0) {
                        throw new Error('please specify env-name or use --all-envs option');
                    }
                    for (const envName of envNames) {
                        if (!existsPkd(envName)) {
                            continue;
                        }

                        console.log(`* updating app=${appName} env=${envName}`);
                        const oldDeployment = loadPkd(envName);
                        const newDeployment = await buildPkd(conf, app.name, envName);
                        if (newDeployment != null) {
                            const same = diffObjects(oldDeployment.objects, newDeployment.objects, '  ');
                            if (existsPkd(newDeployment.header.env.name) && !argv.yes) {
                                getReadlineSync().question(getChalk().red(`  file already exists, are you sure to overwrite ? [ENTER/CTRL-C] `));
                            }
                            savePkd(newDeployment);
                            console.log(getChalk().green(`  deployment ${envName}.pkz updated on app ${app.name}`));
                        } else {
                            console.error(getChalk().red(`  failed to create package ${envName}`));
                        }

                    }


                });
            }

        });

    },
};
