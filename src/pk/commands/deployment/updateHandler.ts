import { getChalk, getReadlineSync } from '../../../lazy';
import { buildPkd } from '../../../pk-deploy/build';
import { savePkd } from '../../../pk-deploy/save';
import { existsPkd } from '../../../pk-deploy/exists';
import { visitEachDeployments, tryCatch } from '../../libs';
import { loadPkd } from '../../../pk-deploy/load';
import { diffObjects } from '../../../pk-diff/diff-objects';
import { IPkCommandInfo } from "../../types";
import { matchBranchIfExist } from '../../../pk-deploy/match';

export default (pk: IPkCommandInfo) => async (argv: any): Promise<any> => {
    await tryCatch(async () => {

        await visitEachDeployments(argv.app, argv.env, argv.cluster, async (projectRoot, projectConf, app, envName, clusterName) => {
            const env = projectConf.getMergedEnv(app.name, envName, clusterName);
            if (!matchBranchIfExist(env, argv.branch)) {
                return;
            }

            const header = `* app = ${app.name}, env = ${envName}, cluster = ${clusterName}`.padEnd(30);

            const oldDeployment = existsPkd(envName, clusterName) ? loadPkd(envName, clusterName) : null;
            const newDeployment = await buildPkd(projectConf, app.name, envName, clusterName);
            if (newDeployment != null) {
                if (oldDeployment) {
                    const same = diffObjects(oldDeployment.objects, newDeployment.objects, '  ', header);
                    if (same) {
                        if (argv.force) {
                            savePkd(newDeployment);
                            console.log(header, getChalk().green(` - same, force write !!!`));
                        } else {
                            console.log(header, getChalk().green(` - same, skipped !!!`));
                        }
                    } else {
                        savePkd(newDeployment);
                        console.log(header, getChalk().green(` - updated !!!`));
                    }
                } else {
                    if (newDeployment.objects.length > 2) {
                        savePkd(newDeployment);
                        console.log(header, getChalk().green(` - created !!!`));
                    } else {
                        console.log(header, getChalk().grey(` - no data !!!`));
                    }
                }
            } else {
                console.error(header, getChalk().red(` - failed to create package ${envName}`));
            }
        });
    }, !!argv.d);

};
