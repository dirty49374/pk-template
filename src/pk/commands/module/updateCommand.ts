import { PkProjectConf } from '../../../pk-conf/projectConf';
import { updateModule } from '../../../pk-conf/module';
import { tryCatch, atProjectDir, atHomeDir } from '../../libs';
import { IPkCommandInfo } from "../../types";
import { PkConf } from '../../../pk-conf/conf';

export default (pk: IPkCommandInfo) => ({
    command: 'update <module-name>',
    desc: 'update module from git repository',
    builder: (yargs: any) => yargs
        .option('branch', { alias: 'b', describe: 'branch name' })
        .option('tag', { alias: 't', describe: 'tag name' })
        .option('global', { alias: 'g', describe: 'branch name', boolean: true }),
    handler: async (argv: any) => {

        await tryCatch(async () => {

            const conf = PkConf.load();
            if (conf == null) {
                throw new Error(`~/${PkConf.FILENAME} not exists`);
            }

            if (argv.global) {
                await atHomeDir(async (dir) => {
                    const mod = conf.data.modules
                        .find((m: any) => m.name == argv.moduleName);
                    if (!mod) {
                        throw new Error(`can not find module ${argv.moduleName}`);
                    }

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
                    PkConf.save(conf);
                    console.log();
                });
            } else {
                await atProjectDir(async (projectRoot, projectConf) => {
                    const mod = projectConf.data.modules
                        .find((m: any) => m.name == argv.moduleName);
                    if (!mod) {
                        throw new Error(`can not find module ${argv.moduleName}`);
                    }

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
                    PkProjectConf.save(projectConf, '.');
                    console.log();
                });
            }


        }, !!argv.d);

    },
});
