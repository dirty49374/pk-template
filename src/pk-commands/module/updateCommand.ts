import { PkConf } from '../../pk-conf/conf';
import { updateModule } from '../../pk-conf/module';
import { atPkConfDir, atModuleDir } from '../util';

export default {
    command: 'update <module-name>',
    desc: 'update module from git repository',
    builder: (yargs: any) => yargs
        .option('branch', { describe: 'branch name' })
        .option('tag', { describe: 'tag name' }),
    handler: async (argv: any) => {

        await atPkConfDir(async (dir, conf) => {

            await atModuleDir(conf, argv.moduleName, async mod => {
                if (argv.branch) {
                    mod.branch = argv.branch;
                    delete mod.tag;
                } else if (argv.tag) {
                    mod.tag = argv.tag;
                    delete mod.branch;
                } else {
                    mod.branch = 'master';
                }
                updateModule(mod);
            });

            PkConf.save('.', conf);
        });

    },
}
