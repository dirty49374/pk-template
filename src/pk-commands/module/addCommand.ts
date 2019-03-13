import { PkProjectFile } from '../../pk-conf/conf';
import { PkModuleHelper, IPkModule } from '../../pk-module/PkModuleHelper';

export default {
    command: 'add <name> <repository>',
    desc: 'initialize project',
    builder: (yargs: any) => yargs
        .option('branch', { describe: 'branch name' })
        .option('tag', { describe: 'tag name' }),
    handler: (argv: any) => {
        console.log(argv);
        const { dir, conf } = PkProjectFile.find();
        if (!dir || !conf) {
            throw new Error(`${PkProjectFile.FILENAME} file not found`);
        }

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

        const helper = new PkModuleHelper(dir, mod);
        helper.clone();

        PkProjectFile.save(dir, conf);
    },
}
