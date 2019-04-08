// import { getChalk } from '../../../lazy';
// import { buildPkd } from '../../../pk-deploy/build';
// import { existsPkd } from '../../../pk-deploy/exists';
// import { visitEachDeployments, tryCatch, atProjectDir } from '../../libs';
// import { loadPkd } from '../../../pk-deploy/load';
// import { diffObjects } from '../../../pk-diff/diff-objects';
// import { IPkCommandInfo } from "../../types";
// import nodemon from 'nodemon';

// export default (pk: IPkCommandInfo) => ({
//     command: 'diff [app] [env]',
//     desc: 'diff a deployment changes',
//     builder: (yargs: any) => yargs
//         .option('all', { describe: 'all apps and envs', boolean: false })
//         .option('watch', { alias: 'w', describe: 'all apps and envs', boolean: false })
//         .option('debug', { alias: 'd', describe: 'enable error debugging', boolean: true }),
//     handler: async (argv: any): Promise<any> => {
//         await tryCatch(async () => {
//             if (!argv.app && !argv.env && !argv.all) {
//                 throw new Error('use --all options');
//             }
//             if (argv.watch) {
//                 nodemon({
//                     exec: `pk dep diff ${argv.app || ''} ${argv.env || ''} ${argv.debug ? ' -d' : ''}`,
//                     ext: 'pkt,yaml,yml',
//                 });
//             } else {
//                 console.log('* diff ========================');
//                 await visitEachDeployments(argv.app, argv.env, async (projectRoot, projectConf, app, envName) => {
//                     // if (!existsPkd(envName)) {
//                     //     return;
//                     // }

//                     // const header = `* app = ${app.name}, env = ${envName}`.padEnd(30);

//                     // const oldDeployment = loadPkd(envName);
//                     // const newDeployment = await buildPkd(projectConf, app.name, envName);
//                     // const same = diffObjects(oldDeployment.objects, newDeployment.objects, '  ', header);
//                     // if (same) {
//                     //     console.log(header, getChalk().green(`  same !!!`));
//                     // }
//                 });
//             }

//         }, !!argv.debug);
//     },
// });
