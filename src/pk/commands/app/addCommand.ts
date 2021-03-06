import { PkProjectConf } from '../../../pk-conf/projectConf';
import { atProjectDir, invokeModuleHooks } from '../../libs';
import { v4 as uuid } from 'uuid';
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { dumpYaml, dumpYamlAll } from '../../../pk-yaml';
import { IPkCommandInfo } from "../../types";
import { CustomYamlJsTag } from '../../../pk-yaml/customTags';

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

      const pkt = [
        {
          ['/properties']: {
            env: null,
            cluster: null,
            namespace: null,
            deployment: null,
          },
          ['/schema']: {
            title: `${argv.appName} in ${projectConf.data.project.name} project`,
            description: `describe app details here`,
            properties: {
              env: { type: 'string', description: 'pk environment name', },
              cluster: { type: 'string', description: 'pk cluster name', },
              namespace: { type: 'string', description: 'prefered namespace name', },
              deployment: { type: 'object', description: 'pk deployment information', },
            },
            required: ['env', 'cluster', 'namespace'],
          }
        },
        {
          apiVersion: 'v1',
          kind: 'Namespace',
          metadata: {
            name: new CustomYamlJsTag('namespace', ''),
          }
        },
        { ['/comment']: '---' },
      ];

      await invokeModuleHooks(pk, projectConf, 'app.add', { projectConf, app, pkt });

      const yaml = dumpYamlAll(pkt);
      writeFileSync(`${app.name}/app.pkt`, yaml, 'utf8');

      PkProjectConf.save(projectConf, '.');
    });
  },
});
