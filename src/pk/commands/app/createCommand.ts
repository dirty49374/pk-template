import { PkConf } from '../../../pk-conf/conf';
import { atPkConfDir } from '../../libs';
import { v4 as uuid } from 'uuid';
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { dumpYaml } from '../../../pk-yaml';

export default {
    command: 'create <app-name>',
    desc: 'create new app entry',
    builder: (yargs: any) => yargs,
    handler: async (argv: any) => {
        await atPkConfDir(async (root, conf) => {
            if (!argv.appName.match(/^[a-zA-Z0-9]+$/)) {
                throw new Error(`app name ${argv.appName} is invalid`);
            }
            const app = {
                id: uuid(),
                name: argv.appName,
            };
            conf.addApp(app);
            existsSync(app.name) || mkdirSync(app.name);

            const data = {
                input: {
                    cluster: null,
                    namespace: null,
                },
                schema: {},
                routine: [],
            };
            const yaml = dumpYaml(data);
            writeFileSync(`${app.name}/app.pkt`, yaml, 'utf8');

            PkConf.save('.', conf);
        });
    },
}
