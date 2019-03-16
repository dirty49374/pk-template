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
        await atProjectDir(async (root, conf) => {
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

            PkProjectConf.save(conf, '.');
        });
    },
});
