import { PkConf } from '../../pk-conf/conf';
import { cloneModule } from '../../pk-conf/module';
import { IPkModule } from '../../pk-conf';
import { atPkConfDir } from '../util';

export default {
    command: 'add <name> <repository>',
    desc: 'initialize project',
    builder: (yargs: any) => yargs
        .option('branch', { describe: 'branch name' })
        .option('tag', { describe: 'tag name' }),
    handler: async (argv: any) => {

        await atPkConfDir(async (root, conf) => {

            const mod: IPkModule = {
                name: argv.name,
                repository: argv.repository,
            };
            if (argv.branch) {
                mod.branch = argv.branch;
            } else if (argv.tag) {
                mod.tag = argv.tag;
            } else {
                mod.branch = 'master';
            }
            conf.addModule(mod);

            cloneModule(mod);

            PkConf.save('.', conf);

        });
    },
}
