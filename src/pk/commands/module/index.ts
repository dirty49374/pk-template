import { IPkCommandInfo } from "../../types";

export default (pk: IPkCommandInfo) => ({
    command: 'module <command>',
    desc: 'module commands',
    builder: (yargs: any) => yargs
        .command(require('./addCommand').default(pk))
        .command(require('./updateCommand').default(pk)),
});
