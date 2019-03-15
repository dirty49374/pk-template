import { getChalk, getReadlineSync } from '../../../lazy';
import { buildPkd } from '../../../pk-deploy/build';
import { savePkd } from '../../../pk-deploy/save';
import { existsPkd } from '../../../pk-deploy/exists';
import { visitEachAppAndEnv } from '../../libs';
import { loadPkd } from '../../../pk-deploy/load';
import { diffObjects } from '../../../pk-diff/diff-objects';


export default {
    command: 'update',
    desc: 'update a deployment for environment',
    builder: (yargs: any) => yargs
        .option('app', { describe: 'app name, (default = *)', default: '*' })
        .option('env', { describe: 'environment name (default = *)', default: '*' })
        .option('yes', { describe: 'overwrite without confirmation', boolean: true }),
    handler: async (argv: any): Promise<any> => {
        await argv.$pk.tryCatch(async () => {

            await visitEachAppAndEnv(argv.app, argv.env, async (root, conf, app, envName) => {
                if (!existsPkd(envName)) {
                    console.log('not exists')
                    return;
                }

                console.log(`* app = ${app.name}, env = ${envName}`);

                const oldDeployment = loadPkd(envName);
                const newDeployment = await buildPkd(conf, app.name, envName);
                if (newDeployment != null) {
                    const same = diffObjects(oldDeployment.objects, newDeployment.objects, '  ');
                    if (existsPkd(newDeployment.header.env.name) && !argv.yes && !same) {
                        getReadlineSync().question(getChalk().red(`  file already exists, are you sure to overwrite ? [ENTER/CTRL-C] `));
                    }
                    savePkd(newDeployment);
                    if (same) {
                        console.log(getChalk().green(`  same !!!`));
                    } else {
                        console.log(getChalk().green(`  updated !!!`));
                    }
                } else {
                    console.error(getChalk().red(`  failed to create package ${envName}`));
                }

                console.log();
            });
        });

    },
};
