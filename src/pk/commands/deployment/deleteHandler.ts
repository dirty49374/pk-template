import { visitEachDeployments, tryCatch, atAppDir } from '../../libs';
import { IPkCommandInfo } from "../../types";
import { deletePkd } from '../../../pk-deploy/delete';
import { IPkdApplierOption } from '../../../pk-deploy/options';
import { execSync } from 'child_process';

export default (pk: IPkCommandInfo) => async (argv: any) => {
  await tryCatch(async () => {
    await visitEachDeployments(argv.app, argv.env, argv.cluster, async (projectRoot, projectConf, app, envName, clusterName) => {
      if (!projectConf.isDeployExecutable(argv.branch, app.name, envName, clusterName)) {
        return;
      }
      const opt: IPkdApplierOption = {
        yes: argv.yes || false,
        dryRun: argv.dryRun || false,
        immediate: argv.immediate || false,
      }
      const envdata = projectConf.getMergedEnv(app.name, envName, clusterName);
      if (!clusterName) {
        console.log(pk.getChalk().red(`cluster is not defined ${app.name} ${envName}`));
        return;
      }

      console.log(`* app = ${app.name}, env = ${envName}, cluster = ${clusterName}`);
      await atAppDir(app.name, async () => {
        await deletePkd(
          projectConf.data.project.name,
          app.name,
          envName,
          clusterName,
          opt
        );
      });

    });
  }, !!argv.d);
};
