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
        await atPkConfDir(async (dir, conf) => {


        });
    },
}
