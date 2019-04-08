import { PkProjectConf } from '../../../pk-conf/projectConf';
import { atProjectDir, tryCatch, visitEachDeployments } from '../../libs';
import { dumpYaml } from '../../../pk-yaml';
import { IPkCommandInfo } from "../../types";

export default (pk: IPkCommandInfo) => ({
  command: 'show',
  desc: 'show envs',
  builder: (yargs: any) => yargs,
  handler: async (argv: any) => {
    await tryCatch(async () => {
      await visitEachDeployments('all', 'all', 'all', async (projectRoot, projectConf, app, envName, clusterName) => {
        console.log(`* app = ${app.name}, env = ${envName}`);
        const env = projectConf.getMergedEnv(app.name, envName, clusterName);
        console.log(dumpYaml(env).split('\n').map(l => '  ' + l).join('\n'));
      });
    }, !!argv.d);
  },
});
