import { PkProjectConf } from '../../../pk-conf/projectConf';
import { updateModule } from '../../../pk-conf/module';
import { tryCatch, atProjectDir, atHomeDir } from '../../libs';
import { IPkCommandInfo } from "../../types";
import { PkConf } from '../../../pk-conf/conf';
import { IPkModule } from '../../../pk-conf';

export default (pk: IPkCommandInfo) => ({
    command: 'update [module-name]',
    desc: 'update module from git repository',
    builder: (yargs: any) => yargs
        .option('branch', { alias: 'b', describe: 'branch name' })
        .option('tag', { alias: 't', describe: 'tag name' })
        .option('all', { describe: 'all modules' })
        .option('global', { alias: 'g', describe: 'branch name', boolean: true }),
    handler: async (argv: any) => {
        const update = async (mod: IPkModule) => {
            console.log(`* updating ${mod.name} module...`)
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
        }

        await tryCatch(async () => {
            if (!argv.moduleName && !argv.all) {
                throw new Error("please specify module name or --all");
            }

            const conf = PkConf.load();
            if (conf == null) {
                throw new Error(`~/${PkConf.FILENAME} not exists`);
            }

            if (argv.global) {
                await atHomeDir(async (dir) => {
                    for (const mod of conf.data.modules) {
                        if (argv.all || mod.name == argv.moduleName) {
                            await update(mod);
                        }
                    }
                    PkConf.save(conf);
                    console.log();
                });
            } else {
                await atProjectDir(async (projectRoot, projectConf) => {
                    for (const mod of projectConf.data.modules) {
                        if (argv.all || mod.name == argv.moduleName) {
                            await update(mod);
                        }
                    }

                    PkProjectConf.save(projectConf, '.');
                    console.log();
                });
            }


        }, !!argv.d);

    },
});
