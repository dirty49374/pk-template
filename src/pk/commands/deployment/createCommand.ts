import { execCommand } from '../../../pkt/pkt';
import * as PkDeploy from '../../../pk-deploy';
import { getChalk, getReadlineSync } from '../../../lazy';
import { buildPkd } from '../../../pk-deploy/build';
import { savePkd } from '../../../pk-deploy/save';
import { existsPkd } from '../../../pk-deploy/exists';
import { PkConf } from '../../../pk-conf/conf';
import { atPkConfDir, atAppDir, visitEachAppAndEnv } from '../../libs';

export default {
    command: 'create [appName]',
    desc: 'create a deployment for environment',
    builder: (yargs: any) => yargs
        .option('env', { describe: 'environment name' })
        .option('all', { describe: 'update all apps and envs', boolean: true })
        .option('all-apps', { describe: 'update all apps', boolean: true })
        .option('all-envs', { describe: 'update all environments', boolean: true })
        .option('yes', { describe: 'overwrite without confirmation', boolean: true }),
    handler: async (argv: any): Promise<any> => {

        const appName = argv.all || argv.allApps ? '*' : argv.appName;
        const envName = argv.all || argv.allEnvs ? '*' : argv.envName;
        console.log(appName, envName);

        await visitEachAppAndEnv(appName, envName, async (root, conf, app, envName) => {
            console.log(app.name, envName);

            const deployment = await buildPkd(conf, app.name, envName);
            if (deployment != null) {
                if (existsPkd(envName) && !argv.yes) {
                    getReadlineSync().question(getChalk().red(`file ${envName} exists, are you sure to overwrite ? [ENTER/CTRL-C] `));
                }
                savePkd(deployment);
                console.log(getChalk().green(`${envName} created`));
            } else {
                console.error(getChalk().red(`failed to create package ${envName}`));
            }

        });

    },
};
