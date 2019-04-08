import { delay } from '../../common';
import { IPkCommandInfo } from '../types';

export default (pk: IPkCommandInfo) => ({
  command: 'test',
  desc: 'initialize project',
  builder: (yargs: any) => yargs,
  handler: async (argv: any) => {
    console.log(argv);
    console.log('sleeping')
    await delay(3000);
    console.log('done')
  },
});
