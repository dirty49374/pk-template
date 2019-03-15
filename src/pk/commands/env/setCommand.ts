import { PkProjectConf } from '../../../pk-conf/projectConf';
import { atProjectDir, tryCatch } from '../../libs';

export default {
    command: 'set <env-name>',
    desc: 'set env <env-name> -- [--name value ...]',
    builder: (yargs: any) => yargs
        .option('app', { description: 'set env only to app' }),
    handler: async (argv: any) => {
        await tryCatch(async () => {
            await atProjectDir(async (root, conf) => {
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
                    if (!env.values.cluster) {
                        throw new Error(`env ${argv.envName} at ${argv.app} does not have cluster value`);
                    }
                } else {
                    const env = conf.prepareEnv(argv.envName);
                    const data = require('yargs')(argv._.slice(2)).argv;
                    delete data._;
                    delete data['$0'];
                    env.values = {
                        ...env.values,
                        ...data
                    };
                    if (!env.values.cluster) {
                        throw new Error(`env ${argv.envName} does not have cluster value`);
                    }
                }
                PkProjectConf.save(conf, '.');
            });
        }, !!argv.d);
    },
}
