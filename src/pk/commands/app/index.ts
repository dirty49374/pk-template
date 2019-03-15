export default {
    command: 'app <command>',
    desc: 'app commands',
    builder: (yargs: any) => yargs
        .command(require('./addCommand').default),
}
