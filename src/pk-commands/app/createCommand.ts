import { PkConf } from '../../pk-conf/conf';
import { cloneModule } from '../../pk-conf/module';
import { IPkModule } from '../../pk-conf';

export default {
    command: 'add <name> <repository>',
    desc: 'initialize project',
    builder: (yargs: any) => yargs
        .option('branch', { describe: 'branch name' })
        .option('tag', { describe: 'tag name' }),
    handler: (argv: any) => {
        console.log(argv);
        const { dir, conf } = PkConf.find();
        if (!dir || !conf) {
            throw new Error(`${PkConf.FILENAME} file not found`);
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

        cloneModule(dir, mod);

        PkConf.save(dir, conf);
    },
}
