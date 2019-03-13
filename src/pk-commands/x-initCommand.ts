// import fs from 'fs';
// import jsyaml from 'js-yaml';
// import { IPkctlDiffOptions } from './types';
// import { IPktModule, PKMODULE_FILE_NAME, PKTLIBS_DIR_NAME } from '../pk-template/types';

// class Command {
//     constructor(private options: IPkctlDiffOptions) {
//     }

//     async execute() {
//         const module: IPktModule = {
//             repositories: {},
//             envs: [],
//         }
//         const yaml = jsyaml.dump(module);

//         try {
//             if (fs.existsSync(PKMODULE_FILE_NAME)) {
//                 console.log(`${PKMODULE_FILE_NAME} exists`);
//             } else {
//                 fs.writeFileSync(PKMODULE_FILE_NAME, yaml, 'utf8');
//                 console.log(`${PKMODULE_FILE_NAME} created`);
//             }
//             if (fs.existsSync(PKTLIBS_DIR_NAME)) {
//                 console.log(`${PKTLIBS_DIR_NAME} exists`);
//             } else {
//                 fs.mkdirSync(PKTLIBS_DIR_NAME);
//                 console.log(`${PKTLIBS_DIR_NAME}/ created`);
//             }
//         } catch (e) {
//         }
//         console.log('module initialized');
//     }
// }

// export default {
//     command: 'init',
//     desc: 'init a module',
//     builder: (yargs: any) => yargs,
//     handler: (argv: any) => new Command(argv).execute(),
// };
