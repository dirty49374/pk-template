import { IPkCommandInfo } from "../../types";
import nodemon from 'nodemon';

export default (pk: IPkCommandInfo) => {
  const diffHandler = require('./diffHandler').default(pk);
  const updateHandler = require('./updateHandler').default(pk);
  const deleteHandler = require('./deleteHandler').default(pk);
  const applyHandler = require('./applyHandler').default(pk);

  return {
    command: 'deployment [app] [env] [cluster]',
    desc: 'deployment commands',
    aliases: ['dep', 'deploy'],
    builder: (yargs: any) => yargs
      .option('branch', { aliases: ['b'], describe: 'filter deployment using branch specified in env' })
      .option('dry-run', { alias: ['dry'], describe: 'dry run [--apply, --delete]', boolean: true })
      .option('immediate', { alias: ['imm'], describe: 'execute immediately without initial 5 seconds delay [--apply, --delete]', boolean: true })
      .option('yes', { alias: ['y'], describe: 'overwrite without confirmation [--apply, --delete]', boolean: true })
      .option('force', { alias: ['f'], describe: 'force write pkd even if output is same [--update]', boolean: true })
      .option('watch', { alias: 'w', describe: 'all apps and envs [--diff]', boolean: false })
      .option('debug', { alias: 'd', describe: 'enable error debugging', boolean: true })
      .option('diff', { describe: 'diff app.pkt and pkd', boolean: true })
      .option('update', { describe: 'update deployment files (*.pkd)', boolean: true })
      .option('apply', { describe: 'apply deployment to cluster', boolean: true })
      .option('delete', { describe: 'delete deployment', boolean: true }),
    handler: async (argv: any) => {
      if (argv.watch) {
        const args = process.argv.filter(w => w !== '-w' && w !== '--watch');
        args.splice(0, 2);
        const exec = `pk ${args.join(' ')}`;
        await nodemon({
          exec,
          ext: 'pkt,yaml,yml',
        });
        return;
      }
      if (argv.diff) {
        console.log("* diff ====================");
        await diffHandler(argv);
        console.log();
      }
      if (argv.update) {
        console.log("* update ====================");
        await updateHandler(argv);
        console.log();
      }
      if (argv.apply) {
        console.log("* apply ====================");
        await applyHandler(argv);
        console.log();
      }
      if (argv.delete) {
        console.log("* delete ====================");
        await deleteHandler(argv);
        console.log();
      }
    },
  };
};
