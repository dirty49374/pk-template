import { PkProjectConf } from '../../../pk-conf/projectConf';
import { atProjectDir, tryCatch, visitEachAppAndEnv } from '../../libs';
import { dumpYaml } from '../../../pk-yaml';

export default {
    command: 'show',
    desc: 'show envs',
    builder: (yargs: any) => yargs,
    handler: async (argv: any) => {
        await tryCatch(async () => {
            await visitEachAppAndEnv('*', '*', async (root, conf, app, envName) => {
                console.log(`* app = ${app.name}, env = ${envName}`);
                const env = conf.getMergedEnv(app.name, envName);
                console.log(dumpYaml(env).split('\n').map(l => '  ' + l).join('\n'));
            });
        }, !!argv.d);
    },
}
