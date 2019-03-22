import { getChalk, getReadlineSync } from '../../../lazy';
import { buildPkd } from '../../../pk-deploy/build';
import { savePkd } from '../../../pk-deploy/save';
import { existsPkd } from '../../../pk-deploy/exists';
import { visitEachAppAndEnv, tryCatch } from '../../libs';
import { loadPkd } from '../../../pk-deploy/load';
import { diffObjects } from '../../../pk-diff/diff-objects';
import { IPkCommandInfo } from "../../types";

export default (pk: IPkCommandInfo) => ({
    command: 'update [app] [env]',
    desc: 'update a pkd deployment file (update does not apply to clusters)',
    builder: (yargs: any) => yargs
        .option('all', { describe: 'all apps ane envs', boolean: false })
        .option('force', { aliases: ['f'], describe: 'overwrite pkd file when content is identical (changes timestamp)' })
        .option('yes', { aliases: ['y'], describe: 'overwrite without confirmation', boolean: true }),
    handler: async (argv: any): Promise<any> => {
        await tryCatch(async () => {
            if (!argv.app && !argv.env && !argv.all) {
                throw new Error('use --all options');
            }
            await visitEachAppAndEnv(argv.app, argv.env, async (projectRoot, projectConf, app, envName) => {
                if (!existsPkd(envName)) {
                    return;
                }

                const header = `* app = ${app.name}, env = ${envName}`.padEnd(30);
                const oldDeployment = loadPkd(envName);
                const newDeployment = await buildPkd(projectConf, app.name, envName);
                if (newDeployment != null) {
                    const same = diffObjects(oldDeployment.objects, newDeployment.objects, '  ', header);
                    if (same) {
                        if (argv.force) {
                            savePkd(newDeployment);
                            console.log(header, getChalk().green(` - same, force write !!!`));
                        } else {
                            console.log(header, getChalk().green(` - same, skipped !!!`));
                        }
                    } else {
                        savePkd(newDeployment);
                        console.log(header, getChalk().green(` - updated !!!`));
                    }
                } else {
                    console.error(header, getChalk().red(` - failed to create package ${envName}`));
                }
            });
        }, !!argv.d);

    },
});
