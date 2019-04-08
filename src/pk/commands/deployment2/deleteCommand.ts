import { visitEachDeployments, tryCatch, atAppDir } from '../../libs';
import { IPkCommandInfo } from "../../types";
import { deletePkd } from '../../../pk-deploy/delete';
import { IPkdApplierOption } from '../../../pk-deploy/options';
import { execSync } from 'child_process';

export default (pk: IPkCommandInfo) => ({
    command: 'delete [app] [env]',
    desc: 'delete deployments',
    builder: (yargs: any) => yargs
        .option('all', { describe: 'all apps and envs', boolean: false })
        .option('dry-run', { alias: ['dry'], describe: 'dry run', boolean: true })
        .option('immediate', { alias: ['imm'], describe: 'execute immediately without initial 5 seconds delay', boolean: true })
        .option('yes', { alias: ['y'], describe: 'overwrite without confirmation', boolean: true }),
    handler: async (argv: any) => {
        await tryCatch(async () => {
            if (!argv.app && !argv.env && !argv.all) {
                throw new Error('use --all options');
            }

            await visitEachDeployments(argv.app, argv.env, async (projectRoot, projectConf, app, envName) => {

                const opt: IPkdApplierOption = {
                    yes: argv.yes || false,
                    dryRun: argv.dryRun || false,
                    immediate: argv.immediate || false,
                }
                const envdata = projectConf.getMergedEnv(app.name, envName);
                if (!envdata || !envdata.values || !envdata.values.cluster) {
                    console.log(pk.getChalk().red(`cluster is not defined ${app.name} ${envName}`));
                    return;
                }

                console.log(`deleting ${app.name} - ${envName}`);
                await atAppDir(app.name, async () => {
                    execSync('ls -al');
                    await deletePkd(
                        projectConf.data.project.name,
                        app.name,
                        envName,
                        envdata.values.cluster,
                        opt
                    );
                });

            });
        }, !!argv.d);
    },
});
