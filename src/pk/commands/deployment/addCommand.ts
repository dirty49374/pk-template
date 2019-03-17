import { getChalk, getReadlineSync } from '../../../lazy';
import { buildPkd } from '../../../pk-deploy/build';
import { savePkd } from '../../../pk-deploy/save';
import { existsPkd } from '../../../pk-deploy/exists';
import { visitEachAppAndEnv, tryCatch } from '../../libs';
import { IPkCommandInfo } from "../../types";

export default (pk: IPkCommandInfo) => ({
    command: 'add',
    desc: 'add a deployment for environment',
    builder: (yargs: any) => yargs
        .option('app', { describe: 'app name, (default = *)', default: '*' })
        .option('env', { describe: 'environment name (default = *)', default: '*' })
        .option('all', { describe: 'deploy all apps and environments', boolean: true })
        .option('yes', { describe: 'overwrite without confirmation', boolean: true }),
    handler: async (argv: any): Promise<any> => {
        await tryCatch(async () => {
            if (argv.app === '*' && argv.env === '*' && !argv.all) {
                throw new Error('please specify --app app-name or --env env-name or --all');
            }

            await visitEachAppAndEnv(argv.app, argv.env, async (root, conf, app, envName) => {
                console.log(`* ${app.name} ${envName}`);

                if (existsPkd(envName)) {
                    console.log(getChalk().yellow(`  already exists, skip`));
                    return;
                }
                const deployment = await buildPkd(conf, app.name, envName);
                if (deployment.objects.length == 2) {
                    console.log(getChalk().yellow(`  no outputs, skip`));
                    return;
                }
                if (deployment != null) {

                    if (existsPkd(envName) && !argv.yes) {
                        getReadlineSync().question(getChalk().red(`  file ${envName} exists, are you sure to overwrite ? [ENTER/CTRL-C] `));
                    }
                    savePkd(deployment);
                    console.log(getChalk().green(`  ${envName} created`));
                } else {
                    console.error(getChalk().red(`  failed to create package ${envName}`));
                }

            });
        }, !!argv.d);
    },
});
