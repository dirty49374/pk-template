import { PkConf } from '../../pk-conf/conf';
import { atPkConfDir } from '../util';
import { v4 as uuid } from 'uuid';
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { dumpYaml } from '../../pk-yaml';

export default {
    command: 'add <app-name>',
    desc: 'create new app entry',
    builder: (yargs: any) => yargs,
    handler: async (argv: any) => {
        await atPkConfDir(async (root, conf) => {
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
