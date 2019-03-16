import { PkProjectConf } from '../../pk-conf/projectConf';
import { mkdirSync, existsSync } from 'fs';
import { PkConf } from '../../pk-conf/conf';
import { tryCatch } from '../libs';
import { insideGit } from '../../pk-path/insideGit';
import { MODULE_DIR } from '../../pk-conf/module';
import { IPkCommandInfo } from '../types';

export default (pk: IPkCommandInfo) => ({
    command: 'init <project-name> [directory]',
    desc: 'initialize project',
    builder: (yargs: any) => yargs,
    handler: async (argv: any) => {
        const directory = argv.directory || 'pk';

        await tryCatch(async () => {
            const conf = PkConf.load();
            if (!conf) {
                throw new Error('~/pk.yaml not exists. use pk config');
            }
            if (!conf.data.email) {
                throw new Error('user is not set. use pk config --user to set');
            }

            if (!argv.projectName.match(/^[a-zA-Z0-9]+$/)) {
                throw new Error(`app name ${argv.projectName} is invalid`);
            }

            if (!insideGit()) {
                throw new Error(`need git reporitory to create project`);
            }

            console.log(`* creating ${directory}/ directory ...`);
            if (!existsSync(argv.projectConf)) {
                mkdirSync(directory);
            }

            console.log(`* initializing ${directory}/${PkProjectConf.FILENAME} file ...`)
            const file = PkProjectConf.create(argv.projectName, conf.data.email);
            if (PkProjectConf.exists(directory)) {
                throw new Error(`project ${argv.projectName} already exists`)
            }
            PkProjectConf.save(file, directory);

            const modulesDir = `${directory}/${MODULE_DIR}`;
            console.log(`* creating ${modulesDir}/ directories...`);
            if (!existsSync(modulesDir)) {
                mkdirSync(modulesDir);
            }
        }, argv.d);
    },
});
