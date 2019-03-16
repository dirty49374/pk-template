import { PkProjectConf } from '../../../pk-conf/projectConf';
import { updateModule } from '../../../pk-conf/module';
import { atProjectDir, atModuleDir, tryCatch } from '../../libs';
import { IPkCommandInfo } from "../../types";

export default (pk: IPkCommandInfo) => ({
    command: 'update <module-name>',
    desc: 'update module from git repository',
    builder: (yargs: any) => yargs
        .option('branch', { describe: 'branch name' })
        .option('tag', { describe: 'tag name' }),
    handler: async (argv: any) => {

        await tryCatch(async () => {
            const conf = pk.conf;
            const mod = pk.conf.modules
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
            PkProjectConf.save(conf, '.');
            console.log();
        }, !!argv.d);

    },
});
