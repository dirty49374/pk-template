import { PkProjectConf } from '../../../pk-conf/projectConf';
import { cloneModule } from '../../../pk-conf/module';
import { IPkModule } from '../../../pk-conf';
import { atProjectDir, tryCatch } from '../../libs';
import { PkConf } from '../../../pk-conf/conf';

export default {
    command: 'add <module-name> [repository]',
    desc: 'initialize project',
    builder: (yargs: any) => yargs
        .option('branch', { describe: 'branch name' })
        .option('tag', { describe: 'tag name' }),
    handler: async (argv: any) => {
        await tryCatch(async () => {
            let mod: IPkModule = {
                name: argv.moduleName,
                repository: argv.repository,
            };

            if (!mod.repository) {
                const conf = PkConf.load();
                if (conf == null) {
                    throw new Error(`repository is not set, ~/${PkConf.FILENAME} not exists`);
                }

                const mod1 = conf.data.modules.find(m => m.name == argv.moduleName);
                if (!mod1) {
                    throw new Error(`repository is not set, cannot find ${argv.moduleName} module entry in ~/${PkConf.FILENAME}`);
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

            await atProjectDir(async () => {
                argv.$pk.conf.addModule(mod);

                await cloneModule(mod);

                PkProjectConf.save(argv.$pk.conf, '.');
            });
        }, !!argv.d);
    },
}
