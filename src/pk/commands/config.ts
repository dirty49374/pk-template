import { PkProjectConf } from '../../pk-conf/projectConf';
import { mkdirSync } from 'fs';
import { PkConf } from '../../pk-conf/conf';
import { tryCatch } from '../libs';
import { dumpYaml } from '../../pk-yaml';

export default {
    command: 'config',
    desc: 'config',
    builder: (yargs: any) => yargs
        .option('email', { description: 'your email' })
        .option('module', { description: 'module (--module name=git-repo)' }),
    handler: async (argv: any) => {
        await tryCatch(async () => {

            const conf = PkConf.load() || new PkConf({
                email: '',
                modules: [],
            });

            if (argv.email) {
                conf.data.email = argv.email;
            }

            if (argv.module) {
                const sp = argv.module.split('=', 2);
                conf.data.modules.push({
                    name: sp[0],
                    repository: sp[1],
                    branch: 'master',
                });
            }

            PkConf.save(conf);

            console.log(dumpYaml(conf.data));

            if (!conf.data.email) {
                throw new Error('email must be set. use pk config --email');
            }
        }, argv.d);
    },
}
