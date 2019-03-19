import { getChalk, getReadlineSync } from '../../../lazy';
import { buildPkd } from '../../../pk-deploy/build';
import { savePkd } from '../../../pk-deploy/save';
import { existsPkd } from '../../../pk-deploy/exists';
import { visitEachAppAndEnv, tryCatch } from '../../libs';
import { loadPkd } from '../../../pk-deploy/load';
import { diffObjects } from '../../../pk-diff/diff-objects';
import { IPkCommandInfo } from "../../types";

export default (pk: IPkCommandInfo) => ({
    command: 'update',
    desc: 'update a deployment for environment',
    builder: (yargs: any) => yargs
        .option('app', { aliases: ['a'], describe: 'app name, (default = *)', default: '*' })
        .option('env', { aliases: ['e'], describe: 'environment name (default = *)', default: '*' })
        .option('force', { aliases: ['f'], describe: 'environment name (default = *)' })
        .option('yes', { aliases: ['y'], describe: 'overwrite without confirmation', boolean: true }),
    handler: async (argv: any): Promise<any> => {
        await tryCatch(async () => {

            await visitEachAppAndEnv(argv.app, argv.env, async (projectRoot, projectConf, app, envName) => {
                if (!existsPkd(envName)) {
                    return;
                }

                console.log(`* app = ${app.name}, env = ${envName}`);

                const oldDeployment = loadPkd(envName);
                const newDeployment = await buildPkd(projectConf, app.name, envName);
                if (newDeployment != null) {
                    const same = diffObjects(oldDeployment.objects, newDeployment.objects, '  ');
                    if (same) {
                        if (argv.force) {
                            savePkd(newDeployment);
                            console.log(getChalk().green(`  same, force write !!!`));
                        } else {
                            console.log(getChalk().green(`  same, skipped !!!`));
                        }
                    } else {
                        savePkd(newDeployment);
                        console.log(getChalk().green(`  updated !!!`));
                    }
                } else {
                    console.error(getChalk().red(`  failed to create package ${envName}`));
                }

                console.log();
            });
        }, !!argv.d);

    },
});
