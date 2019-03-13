import { PkProjectFile } from '../../pk-conf/conf';
import { PkModuleHelper, IPkModule } from '../../pk-module/PkModuleHelper';

export default {
    command: 'update <module-name>',
    desc: 'update module from git repository',
    builder: (yargs: any) => yargs
        .option('branch', { describe: 'branch name' })
        .option('tag', { describe: 'tag name' }),
    handler: (argv: any) => {
        const { dir, conf } = PkProjectFile.find();
        if (!dir || !conf) {
            throw new Error(`${PkProjectFile.FILENAME} file not found`);
        }

        const mod = conf.getModule(argv.moduleName);
        if (!mod) {
            throw new Error(`module ${argv.moduleName} is not defined.`);
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
        console.log(mod);

        const helper = new PkModuleHelper(dir, mod);
        helper.update();

        PkProjectFile.save(dir, conf);
    },
}
