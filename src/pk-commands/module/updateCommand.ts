import { PkConf } from '../../pk-conf/conf';
import { updateModule } from '../../pk-conf/module';

export default {
    command: 'update <module-name>',
    desc: 'update module from git repository',
    builder: (yargs: any) => yargs
        .option('branch', { describe: 'branch name' })
        .option('tag', { describe: 'tag name' }),
    handler: (argv: any) => {
        const { dir, conf } = PkConf.find();
        if (!dir || !conf) {
            throw new Error(`${PkConf.FILENAME} file not found`);
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

        updateModule(dir, mod);

        PkConf.save(dir, conf);
    },
}
