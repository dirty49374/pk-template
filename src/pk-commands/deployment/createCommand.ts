import { execCommand } from '../../pkt/pkt';
import * as PkDeploy from '../../pk-deploy';
import { getChalk, getReadlineSync } from '../../lazy';
import { buildPkd } from '../../pk-deploy/build';
import { savePkd } from '../../pk-deploy/save';
import { existsPkd } from '../../pk-deploy/exists';
import { PkConf } from '../../pk-conf/conf';

export default {
    command: 'create <appName> <envName>',
    desc: 'create a deployment for environment',
    builder: (yargs: any) => yargs
        .option('cluster')
        .option('yes', { describe: 'overwrite without confirmation', boolean: true }),
    handler: async (argv: any): Promise<any> => {
        const { dir, conf } = PkConf.find('.');
        if (!dir || !conf) {
            throw new Error('cannot find pk.conf file');
        }
        const deployment = await buildPkd(dir, conf, argv.appName, argv.envName);

        if (deployment != null) {
            if (existsPkd(deployment) && !argv.yes) {
                getReadlineSync().question(getChalk().red(`file already exists, are you sure to overwrite ? [ENTER/CTRL-C] `));
            }
            savePkd(deployment);
            console.log(getChalk().green(`${argv.envName} created`));
        } else {
            console.error(getChalk().red(`failed to create package ${argv.envName}`));
        }
    },
};
