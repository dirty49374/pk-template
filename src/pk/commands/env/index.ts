import { IPkCommandInfo } from "../../types";

export default (pk: IPkCommandInfo) => ({
    command: 'env <command>',
    desc: 'env commands',
    builder: (yargs: any) => yargs
        .command(require('./setCommand').default(pk))
        .command(require('./listCommand').default(pk))
        .command(require('./showCommand').default(pk)),
});
