import { IPkCommandInfo } from "../../types";

export default (pk: IPkCommandInfo) => ({
    command: 'deployment <command>',
    desc: 'deployment commands',
    aliases: ['dep', 'deploy'],
    builder: (yargs: any) => yargs
        .command(require('./addCommand').default(pk))
        .command(require('./diffCommand').default(pk))
        .command(require('./updateCommand').default(pk))
        .command(require('./deleteCommand').default(pk))
        .command(require('./applyCommand').default(pk)),
});
