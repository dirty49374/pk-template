import { atProjectDir, tryCatch } from '../../libs';

export default () => ({
    command: 'show',
    desc: 'show envs',
    builder: (yargs: any) => yargs,
    handler: async (argv: any) => {
        await tryCatch(async () => {
            await atProjectDir(async (projectRoot, projectConf) => {

                console.log('* project environments');
                const envs: any = projectConf.data.envs.reduce((sum, e) => ({ ...sum, [e.name]: e.values.cluster }), {});
                for (const env of Object.keys(envs)) {
                    console.log(`  ${env.padEnd(20)} - ${envs[env]}`);
                }
                console.log();

                for (const app of projectConf.data.apps) {
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
});
