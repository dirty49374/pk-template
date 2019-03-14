import { PkConf } from '../pk-conf/conf';
import { mkdirSync } from 'fs';

export default {
    command: 'init <project-name>',
    desc: 'initialize project',
    builder: (yargs: any) => yargs,
    handler: (argv: any) => {
        if (!argv.projectName.match(/^[a-zA-Z0-9]+$/)) {
            throw new Error(`app name ${argv.projectName} is invalid`);
        }

        console.log('initializing project')
        const file = PkConf.create(argv.projectName, 'unknown');
        PkConf.save('.', file);

        console.log('creating project directories...');
        mkdirSync('pk_modules');
    },
}
