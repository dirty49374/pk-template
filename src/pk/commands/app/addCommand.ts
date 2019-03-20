import { PkProjectConf } from '../../../pk-conf/projectConf';
import { atProjectDir } from '../../libs';
import { v4 as uuid } from 'uuid';
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { dumpYaml } from '../../../pk-yaml';
import { IPkCommandInfo } from "../../types";

export default (pk: IPkCommandInfo) => ({
    command: 'add <app-name>',
    desc: 'add a new app',
    builder: (yargs: any) => yargs,
    handler: async (argv: any) => {
        await atProjectDir(async (projectRoot, projectConf) => {
            if (!argv.appName.match(/^[a-zA-Z0-9]+$/)) {
                throw new Error(`app name ${argv.appName} is invalid`);
            }
            const app = {
                id: uuid(),
                name: argv.appName,
            };
            projectConf.addApp(app);
            existsSync(app.name) || mkdirSync(app.name);

            const data = {
                properties: {
                    env: null,
                    cluster: null,
                    namespace: null,
                },
                schema: {
                    title: `${argv.appName} in ${projectConf.data.project.name} project`,
                    description: `describe app details here`,
                    properties: {
                        env: { type: 'string', description: 'pk environment name', },
                        cluster: { type: 'string', description: 'pk cluster name', },
                        namespace: { type: 'string', description: 'prefered namespace name', },
                    },
                    required: ['env', 'cluster', 'namespace'],
                },
                routine: [
                    { comment: '--- BEGIN CODE ---' },
                    { comment: '--- END CODE ---' },
                ],
            };
            const yaml = dumpYaml(data);
            writeFileSync(`${app.name}/app.pkt`, yaml, 'utf8');

            PkProjectConf.save(projectConf, '.');
        });
    },
});
