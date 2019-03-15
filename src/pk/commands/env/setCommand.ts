import { PkConf } from '../../../pk-conf/conf';
import { atPkConfDir } from '../../libs';

export default {
    command: 'set <env-name>',
    desc: 'set env',
    builder: (yargs: any) => yargs
        .option('cluster', { describe: 'cluster name' })
        .option('app', { describe: 'add app specific env' }),
    handler: async (argv: any) => {
        await atPkConfDir(async (root, conf) => {
            if (argv.app) {
                const env = conf.prepareAppEnv(argv.app, argv.envName);
                if (!env) {
                    throw new Error(`app ${argv.app} does not exists`);
                }
                const data = require('yargs')(argv._.slice(2)).argv;
                delete data._;
                delete data['$0'];
                env.values = {
                    ...env.values,
                    ...data
                };
                PkConf.save('.', conf);
            } else {
                const env = conf.prepareEnv(argv.envName);
                const data = require('yargs')(argv._.slice(2)).argv;
                delete data._;
                delete data['$0'];
                env.values = {
                    ...env.values,
                    ...data
                };
                PkConf.save('.', conf);
            }
        });
    },
}
