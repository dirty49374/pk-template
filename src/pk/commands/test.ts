import { delay } from '../../common';

export default {
    command: 'test',
    desc: 'initialize project',
    builder: (yargs: any) => yargs,
    handler: async (argv: any) => {
        argv.libs.log('hi')
        console.log(argv);
        console.log('sleeping')
        await delay(3000);
        console.log('done')
    },
}
