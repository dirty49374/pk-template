import { getChalk } from '../../../lazy';
import { buildPkd } from '../../../pk-deploy/build';
import { existsPkd } from '../../../pk-deploy/exists';
import { visitEachDeployments, tryCatch, atProjectDir } from '../../libs';
import { loadPkd } from '../../../pk-deploy/load';
import { diffObjects } from '../../../pk-diff/diff-objects';
import { IPkCommandInfo } from "../../types";
import nodemon from 'nodemon';

export default (pk: IPkCommandInfo) => async (argv: any): Promise<any> => {
  await tryCatch(async () => {

    if (argv.watch) {
      nodemon({
        exec: `pk dep diff ${argv.app || ''} ${argv.env || ''} ${argv.debug ? ' -d' : ''}`,
        ext: 'pkt,yaml,yml',
      });
    } else {
      await visitEachDeployments(argv.app, argv.env, argv.cluster, async (projectRoot, projectConf, app, envName, clusterName) => {
        if (!projectConf.isDeployExecutable(argv.branch, app.name, envName, clusterName)) {
          return;
        }

        var begin = new Date().getTime();

        const exists = existsPkd(envName, clusterName);

        const header = `* app = ${app.name}, env = ${envName}, cluster = ${clusterName}`.padEnd(30);

        const oldDeployment = exists ? loadPkd(envName, clusterName) : { header: null, objects: [] };
        const newDeployment = await buildPkd(projectConf, app.name, envName, clusterName);
        const same = diffObjects(oldDeployment.objects, newDeployment.objects, '  ', header);
        if (same) {
          console.log(header, getChalk().green(`  same !!!`));
        }

        var elapsed = new Date().getTime() - begin;
        console.log(`  elapsed ${elapsed} ms`);
      });
    }

  }, !!argv.debug);
};
