import { execCommand } from '../../pkt/pkt';
import * as PkDeploy from '../../pk-deploy';
import { getChalk, getReadlineSync } from '../../lazy';
import { buildPkd } from '../../pk-deploy/build';
import { savePkd } from '../../pk-deploy/save';
import { existsPkd } from '../../pk-deploy/exists';
import { PkConf } from '../../pk-conf/conf';
import { atPkConfDir, atAppDir } from '../util';

export default {
    command: 'create <appName>',
    desc: 'create a deployment for environment',
    builder: (yargs: any) => yargs
        .option('env', { describe: 'environment name' })
        .option('yes', { describe: 'overwrite without confirmation', boolean: true })
        .demandOption(['env'], 'please specify --env option'),
    handler: async (argv: any): Promise<any> => {

        await atPkConfDir(async (root, conf) => {

            await atAppDir(conf, argv.appName, async app => {

                const deployment = await buildPkd(conf, argv.appName, argv.env);
                if (deployment != null) {
                    if (existsPkd(argv.env) && !argv.yes) {
                        getReadlineSync().question(getChalk().red(`file ${argv.env} exists, are you sure to overwrite ? [ENTER/CTRL-C] `));
                    }
                    savePkd(deployment);
                    console.log(getChalk().green(`${argv.env} created`));
                } else {
                    console.error(getChalk().red(`failed to create package ${argv.env}`));
                }

            });
        });

    },
};
