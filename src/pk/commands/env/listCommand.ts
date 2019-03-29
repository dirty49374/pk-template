import { atProjectDir, tryCatch } from '../../libs';
import { getTable } from '../../../lazy';
import { dumpYaml } from '../../../pk-yaml';
import { IPkEnv } from '../../../pk-conf';

export default () => ({
    command: 'list',
    desc: 'list envs',
    builder: (yargs: any) => yargs,
    handler: async (argv: any) => {
        await tryCatch(async () => {
            await atProjectDir(async (projectRoot, projectConf) => {

                const getValueKeys = (envs: IPkEnv[]) => {
                    return envs.reduce((sum: string[], e) => [...new Set([...sum, ...Object.keys(e.values)])], []);
                }

                const extractEnvValues = (env: IPkEnv, valueKeys: string[]): string[] => {
                    const values = valueKeys.map(key => env.values[key] || '');
                    return [
                        env.name,
                        ...values.map(value => typeof (value) === 'object' ? dumpYaml(value) : value)
                    ]
                }

                const table = getTable();

                console.log('* project environments');
                const valueKeys = getValueKeys(projectConf.data.envs);
                const envs: any = projectConf.data.envs.reduce((sum, env) => ({ ...sum, [env.name]: extractEnvValues(env, valueKeys) }), {});
                if (projectConf.data.envs.length) {
                    console.log(table([['name', ...valueKeys], ...Object.values(envs)]));
                } else {
                    console.log('- empty');
                    console.log();
                }

                for (const app of projectConf.data.apps) {
                    if (app.envs) {
                        const appOnlyEnvs = app.envs.filter(e => !envs[e.name])
                        if (appOnlyEnvs.length) {
                            console.log(`* app '${app.name}' only environments`);
                            const valueKeys = getValueKeys(appOnlyEnvs);
                            const values = appOnlyEnvs.map(env => extractEnvValues(env, valueKeys));
                            console.log(table([['name', ...valueKeys], ...values]));
                        }
                    }
                }
            });
        }, !!argv.d);
    },
});
