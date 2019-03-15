import { PkProjectConf } from '../../../pk-conf/projectConf';
import { atProjectDir, tryCatch, visitEachAppAndEnv } from '../../libs';
import { dumpYaml } from '../../../pk-yaml';

export default {
    command: 'show',
    desc: 'show envs',
    builder: (yargs: any) => yargs,
    handler: async (argv: any) => {
        await tryCatch(async () => {
            await atProjectDir(async (root, conf) => {

                console.log('* project environments');
                const envs: any = conf.data.envs.reduce((sum, e) => ({ ...sum, [e.name]: e.values.cluster }), {});
                for (const env of Object.keys(envs)) {
                    console.log(`  ${env.padEnd(20)} - ${envs[env]}`);
                }
                console.log();

                for (const app of conf.data.apps) {
                    if (app.envs) {
                        const appOnlyEnvs = app.envs.filter(e => !envs[e.name]);
                        if (appOnlyEnvs.length) {
                            console.log(`* app '${app.name}' only environments`);
                            for (const env of app.envs) {
                                console.log(`  ${env.name.padEnd(20)} - ${env.values.cluster}`);
                            }
                            console.log();
                        }
                    }
                }
            });
        }, !!argv.d);
    },
}
