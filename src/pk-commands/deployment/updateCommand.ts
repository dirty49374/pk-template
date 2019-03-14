import { execCommand, generate } from '../../pkt/pkt';
import { join, normalize } from 'path';
import { getChalk, getReadlineSync } from '../../lazy';
import { buildPkd } from '../../pk-deploy/build';
import { savePkd } from '../../pk-deploy/save';
import { existsPkd } from '../../pk-deploy/exists';
import { PkConf } from '../../pk-conf/conf';
import { atPkConfDir, atAppDir, visitEachAppAndEnv } from '../util';
import { loadPkd } from '../../pk-deploy/load';
import { diffObjects } from '../../pk-diff/diff-objects';
import { IPkApp, IPkConf, IPkEnv } from '../../pk-conf';

const update = async (conf: PkConf, appName: string, envName: string, options: any) => {
    const oldDeployment = loadPkd(envName);
    const newDeployment = await buildPkd(conf, appName, envName);

    return newDeployment;
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

        const appName = argv.all || argv.allApps ? '*' : argv.appName;
        const envName = argv.all || argv.allEnvs ? '*' : argv.envName;

        await visitEachAppAndEnv(appName, envName, async (root, conf, app, envName) => {
            if (!existsPkd(envName)) {
                return;
            }

            console.log(`* updating app=${app.name} env=${envName}`);

            const oldDeployment = loadPkd(envName);
            const newDeployment = await buildPkd(conf, app.name, envName);
            if (newDeployment != null) {
                const same = diffObjects(oldDeployment.objects, newDeployment.objects, '  ');
                if (existsPkd(newDeployment.header.env.name) && !argv.yes && !same) {
                    getReadlineSync().question(getChalk().red(`  file already exists, are you sure to overwrite ? [ENTER/CTRL-C] `));
                }
                savePkd(newDeployment);
                console.log(getChalk().green(`  deployment ${envName}.pkz updated on app ${app.name}`));
            } else {
                console.error(getChalk().red(`  failed to create package ${envName}`));
            }

        });

    },
};
