import { IPkCommandInfo } from "../../types";

export default (pk: IPkCommandInfo) => ({
  command: 'app <command>',
  desc: 'app commands',
  builder: (yargs: any) => yargs
    .command(require('./addCommand').default(pk)),
})
