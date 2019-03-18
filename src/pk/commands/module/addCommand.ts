import { PkProjectConf } from '../../../pk-conf/projectConf';
import { cloneModule } from '../../../pk-conf/module';
import { IPkModule } from '../../../pk-conf';
import { atProjectDir, tryCatch, atHomeDir } from '../../libs';
import { PkConf } from '../../../pk-conf/conf';
import { IPkCommandInfo } from "../../types";

export default (pk: IPkCommandInfo) => ({
    command: 'add <module-name> [repository]',
    desc: 'initialize project',
    builder: (yargs: any) => yargs
        .option('branch', { alias: 'b', describe: 'branch name' })
        .option('tag', { alias: 't', describe: 'tag name' })
        .option('global', { alias: 'g', describe: 'branch name', boolean: true }),
    handler: async (argv: any) => {
        await tryCatch(async () => {
            let mod: IPkModule = {
                name: argv.moduleName,
                repository: argv.repository,
            };

            const conf = PkConf.load();
            if (conf == null) {
                throw new Error(`~/${PkConf.FILENAME} not exists`);
            }

            if (!mod.repository) {
                const mod1 = conf.data.repositories.find(m => m.name == argv.moduleName);
                if (!mod1) {
                    throw new Error(`cannot find ${argv.moduleName} module entry in ~/${PkConf.FILENAME}`);
                }
                mod = { ...mod1 };
            }

            if (argv.branch) {
                mod.branch = argv.branch;
            } else if (argv.tag) {
                mod.tag = argv.tag;
            } else {
                mod.branch = 'master';
            }

            if (argv.global) {

                await atHomeDir(async () => {
                    conf.addModule(mod);
                    await cloneModule(mod, true);
                    PkConf.save(conf);
                });

            } else {

                await atProjectDir(async () => {
                    pk.projectConf.addModule(mod);
                    await cloneModule(mod, false);
                    PkProjectConf.save(pk.projectConf, '.');
                });
            }

        }, !!argv.d);
    },
});
