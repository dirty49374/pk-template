import { IPkCommandInfo } from "../../types";
import nodemon from 'nodemon';

export default (pk: IPkCommandInfo) => {
  const diffCommand = require('./diffCommand').default(pk).handler;
  const updateCommand = require('./updateCommand').default(pk).handler;
  const deleteCommand = require('./deleteCommand').default(pk).handler;
  const applyCommand = require('./applyCommand').default(pk).handler;

  return {
    command: 'deployment [app] [env] [cluster]',
    desc: 'deployment commands',
    aliases: ['dep', 'deploy'],
    builder: (yargs: any) => yargs
      .option('all', { describe: 'deploy all apps and envs', boolean: true })
      .option('branch', { aliases: ['b'], describe: 'filter deployment using branch specified in env' })
      .option('dry-run', { alias: ['dry'], describe: 'dry run [--apply, --delete]', boolean: true })
      .option('immediate', { alias: ['imm'], describe: 'execute immediately without initial 5 seconds delay [--apply, --delete]', boolean: true })
      .option('yes', { alias: ['y'], describe: 'overwrite without confirmation [--apply, --delete]', boolean: true })
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
        await diffCommand(argv);
        console.log();
      }
      if (argv.update) {
        console.log("* update ====================");
        await updateCommand(argv);
        console.log();
      }
      if (argv.apply) {
        console.log("* apply ====================");
        await applyCommand(argv);
        console.log();
      }
      if (argv.delete) {
        console.log("* delete ====================");
        await deleteCommand(argv);
        console.log();
      }
    },
  };
};
