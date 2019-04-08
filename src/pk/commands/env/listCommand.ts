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

        const buildTable = (envs: IPkEnv[]): string => {
          const convertToPlainObject = (env: IPkEnv) => {
            return {
              name: env.name,
              branch: env.branch,
              ...env.values,
            } as any;
          }

          const buildTableHeader = (envs: Object[]) => {
            const columns: any = {};
            envs.forEach(e => Object.assign(columns, e));
            return Object.keys(columns);
          }

          const table = getTable();
          const plainObj = envs.map(convertToPlainObject);
          const header = buildTableHeader(plainObj);
          const content = plainObj.map(row => header
            .map(col => row[col] || '')
            .map(col => typeof col === 'object' ? dumpYaml(col) : col)
          );
          return table([header, ...content]);
        }

        console.log('* project environments');
        const envs = projectConf.data.envs;
        if (envs.length) {
          const table = buildTable(projectConf.data.envs)
          console.log(table);
        } else {
          console.log('- empty\n');
        }

        for (const app of projectConf.data.apps) {
          if (app.envs) {
            const appOnlyEnvs = app.envs.filter(e => !envs.find(env => env.name === e.name))
            if (appOnlyEnvs.length) {
              console.log(`* app '${app.name}' only environments`);
              const table = buildTable(appOnlyEnvs)
              console.log(table);
            }
          }
        }
      });
    }, !!argv.d);
  },
});
