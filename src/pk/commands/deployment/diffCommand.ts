import { getChalk } from '../../../lazy';
import { buildPkd } from '../../../pk-deploy/build';
import { existsPkd } from '../../../pk-deploy/exists';
import { visitEachAppAndEnv } from '../../libs';
import { loadPkd } from '../../../pk-deploy/load';
import { diffObjects } from '../../../pk-diff/diff-objects';


export default {
    command: 'diff [appName]',
    desc: 'diff a deployment changes',
    builder: (yargs: any) => yargs
        .option('app', { describe: 'app name, (default = *)', default: '*' })
        .option('env', { describe: 'environment name (default = *)', default: '*' }),
    handler: async (argv: any): Promise<any> => {

        await argv.$pk.tryCatch(async () => {

            const appName = argv.app;
            const envName = argv.env;

            await visitEachAppAndEnv(appName, envName, async (root, conf, app, envName) => {
                if (!existsPkd(envName)) {
                    return;
                }

                console.log(`* diff app=${app.name} env=${envName}`);

                const oldDeployment = loadPkd(envName);
                const newDeployment = await buildPkd(conf, app.name, envName);
                const same = diffObjects(oldDeployment.objects, newDeployment.objects, '  ');
                if (same) {
                    console.log(getChalk().green(`  same !!!`));
                }

                console.log();
            });
        });
    },
};
