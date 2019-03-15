import { PkConf } from '../../../pk-conf/conf';
import { updateModule } from '../../../pk-conf/module';
import { atPkConfDir, atModuleDir } from '../../libs';

export default {
    command: 'update <module-name>',
    desc: 'update module from git repository',
    builder: (yargs: any) => yargs
        .option('branch', { describe: 'branch name' })
        .option('tag', { describe: 'tag name' }),
    handler: async (argv: any) => {

        argv.$pk.tryCatch(async () => {
            const conf = argv.$pk.conf;
            const mod = argv.$pk.conf.modules
                .find((m: any) => m.name == argv.moduleName);

            if (argv.branch) {
                mod.branch = argv.branch;
                delete mod.tag;
            } else if (argv.tag) {
                mod.tag = argv.tag;
                delete mod.branch;
            } else {
                mod.branch = 'master';
            }
            await updateModule(mod);
            PkConf.save('.', conf);
            console.log();
        });

    },
}
