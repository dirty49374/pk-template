import { PkProjectConf } from '../../../pk-conf/projectConf';
import { atProjectDir, tryCatch } from '../../libs';
import { IPkCommandInfo } from "../../types";

export default (pk: IPkCommandInfo) => ({
  command: 'set <env-name>',
  desc: 'set env <env-name> -- [--name value ...]',
  builder: (yargs: any) => yargs
    .option('app', { description: 'set env only to app' }),
  handler: async (argv: any) => {
    await tryCatch(async () => {
      await atProjectDir(async (projectRoot, projectConf) => {
        if (argv.app) {
          const env = projectConf.prepareAppEnv(argv.app, argv.envName);
          if (!env) {
            throw new Error(`app ${argv.app} does not exists`);
          }
          const data = require('yargs')(argv._.slice(2)).argv;
          delete data._;
          delete data['$0'];
          if (data.branch) {
            env.branch = data.branch;
            delete data.branch;
          }
          env.values = {
            ...env.values,
            ...data
          };
          if (!env.values.cluster) {
            throw new Error(`env ${argv.envName} at ${argv.app} does not have cluster value`);
          }
        } else {
          const env = projectConf.prepareEnv(argv.envName);
          const data = require('yargs')(argv._.slice(2)).argv;
          delete data._;
          delete data['$0'];
          if (data.branch) {
            env.branch = data.branch;
            delete data.branch;
          }
          env.values = {
            ...env.values,
            ...data
          };
          if (!env.values.cluster) {
            throw new Error(`env ${argv.envName} does not have cluster value`);
          }
        }
        PkProjectConf.save(projectConf, '.');
      });
    }, !!argv.d);
  },
});
