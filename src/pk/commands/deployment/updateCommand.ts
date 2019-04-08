// import { getChalk, getReadlineSync } from '../../../lazy';
// import { buildPkd } from '../../../pk-deploy/build';
// import { savePkd } from '../../../pk-deploy/save';
// import { existsPkd } from '../../../pk-deploy/exists';
// import { visitEachDeployments, tryCatch } from '../../libs';
// import { loadPkd } from '../../../pk-deploy/load';
// import { diffObjects } from '../../../pk-diff/diff-objects';
// import { IPkCommandInfo } from "../../types";
// import { matchBranchIfExist } from '../../../pk-deploy/match';

// export default (pk: IPkCommandInfo) => ({
//     command: 'update [app] [env]',
//     desc: 'update a pkd deployment file (update does not apply to clusters)',
//     builder: (yargs: any) => yargs
//         .option('all', { describe: 'all apps ane envs', boolean: false })
//         .option('branch', { aliases: ['b'], describe: 'filter deployment using branch specified in env' })
//         .option('force', { aliases: ['f'], describe: 'overwrite pkd file when content is identical (changes timestamp)' })
//         .option('yes', { aliases: ['y'], describe: 'overwrite without confirmation', boolean: true })
//         .option('d', { describe: 'enable error debugging', boolean: false }),
//     handler: async (argv: any): Promise<any> => {
//         await tryCatch(async () => {
//             if (!argv.app && !argv.env && !argv.all) {
//                 throw new Error('use --all options');
//             }
//             await visitEachDeployments(argv.app, argv.env, async (projectRoot, projectConf, app, envName) => {
//                 const env = projectConf.getMergedEnv(app.name, envName);
//                 if (!matchBranchIfExist(env, argv.branch)) {
//                     return;
//                 }

//                 const header = `* app = ${app.name}, env = ${envName}`.padEnd(30);

//                 // const oldDeployment = existsPkd(envName) ? loadPkd(envName) : null;
//                 // const newDeployment = await buildPkd(projectConf, app.name, envName);
//                 // if (newDeployment != null) {
//                 //     if (oldDeployment) {
//                 //         const same = diffObjects(oldDeployment.objects, newDeployment.objects, '  ', header);
//                 //         if (same) {
//                 //             if (argv.force) {
//                 //                 savePkd(newDeployment);
//                 //                 console.log(header, getChalk().green(` - same, force write !!!`));
//                 //             } else {
//                 //                 console.log(header, getChalk().green(` - same, skipped !!!`));
//                 //             }
//                 //         } else {
//                 //             savePkd(newDeployment);
//                 //             console.log(header, getChalk().green(` - updated !!!`));
//                 //         }
//                 //     } else {
//                 //         if (newDeployment.objects.length > 2) {
//                 //             savePkd(newDeployment);
//                 //             console.log(header, getChalk().green(` - created !!!`));
//                 //         } else {
//                 //             console.log(header, getChalk().grey(` - no data !!!`));
//                 //         }
//                 //     }
//                 // } else {
//                 //     console.error(header, getChalk().red(` - failed to create package ${envName}`));
//                 // }
//             });
//         }, !!argv.d);

//     },
// });
