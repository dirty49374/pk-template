import { IPkctlApplyOptions } from '../../types';
import { Progress } from '../../../pk-ui/progress';
import { IObject, IKubeCtlConfig, IResourceKey, delay } from '../../../common';
import * as pkyaml from '../../../pk-yaml';
import { PkKubeCtl } from '../../../pk-kubectl/pk-kubectl';
import { PkdCatalog } from '../../../pk-deploy/catalog';
import { getChalk } from '../../../lazy';
import { loadPkd } from '../../../pk-deploy/load';
import { IPkDeployment } from '../../../pk-deploy';
import { join } from 'path';
import { homedir } from 'os';
import { visitEachAppAndEnv, tryCatch, atAppDir } from '../../libs';
import { IPkCommandInfo } from "../../types";
import { deletePkd } from '../../../pk-deploy/delete';
import { IPkdApplierOption } from '../../../pk-deploy/options';
import { execStdin } from '../../../pk-kubectl/exec';
import { execSync } from 'child_process';

export default (pk: IPkCommandInfo) => ({
    command: 'delete',
    desc: 'delete deployments',
    builder: (yargs: any) => yargs
        .option('app', { alias: ['a'], describe: 'app name, (default = *)', default: '*' })
        .option('env', { alias: ['e'], describe: 'environment name (default = *)', default: '*' })
        .option('all', { describe: 'deploy all apps and environments', boolean: true })
        .option('dry-run', { alias: ['dry'], describe: 'dry run', boolean: true })
        .option('immediate', { alias: ['imm'], describe: 'execute immediately without initial 5 seconds delay', boolean: true })
        .option('yes', { alias: ['y'], describe: 'overwrite without confirmation', boolean: true }),
    handler: async (argv: any) => {
        await tryCatch(async () => {

            if (argv.app === '*' && argv.env === '*' && !argv.all) {
                throw new Error('please specify --app app-name or --env env-name or --all');
            }

            await visitEachAppAndEnv(argv.app, argv.env, async (projectRoot, projectConf, app, envName) => {

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
