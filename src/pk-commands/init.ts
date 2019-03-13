import { PkProjectFile } from '../pk-conf/conf';
import { mkdirSync } from 'fs';

export default {
    command: 'init <project-name>',
    desc: 'initialize project',
    builder: (yargs: any) => yargs,
    handler: (argv: any) => {
        console.log('initializing project')
        const file = PkProjectFile.create(argv.projectName, 'unknown');
        PkProjectFile.save('.', file);

        console.log('creating project directories...');
        mkdirSync('pk_modules');
    },
}
