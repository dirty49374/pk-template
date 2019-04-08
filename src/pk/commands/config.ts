import { PkProjectConf } from '../../pk-conf/projectConf';
import { mkdirSync, existsSync } from 'fs';
import { PkConf } from '../../pk-conf/conf';
import { tryCatch, atHomeDir } from '../libs';
import { dumpYaml } from '../../pk-yaml';
import { IPkCommandInfo } from '../types';

export default (pk: IPkCommandInfo) => ({
  command: 'config',
  desc: 'config',
  builder: (yargs: any) => yargs
    .option('email', { alias: 'e', description: 'your email' })
    .option('repository', { alias: ['repo', 'r'], description: 'repository (--repository name=git-repo)' }),
  handler: async (argv: any) => {
    await tryCatch(async () => {

      await atHomeDir(async () => {
        const conf = PkConf.load() || new PkConf({
          email: '',
          modules: [],
          repositories: [],
        });

        if (argv.email) {
          conf.data.email = argv.email;
        }

        if (argv.repository) {
          const sp = argv.repository.split('=', 2);
          conf.data.repositories.push({
            name: sp[0],
            repository: sp[1],
            branch: 'master',
          });
        }

        if (!existsSync('pk-modules')) {
          console.log('mkdir')
          mkdirSync('pk-modules');
        }

        PkConf.save(conf);

        console.log(dumpYaml(conf.data));

        if (!conf.data.email) {
          throw new Error('email must be set. use pk config --email');
        }
      });
    }, argv.d);
  },
});
