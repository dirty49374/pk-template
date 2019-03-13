export default {
    command: 'module <command>',
    desc: 'module commands',
    builder: (yargs: any) => yargs
        .command(require('./addCommand').default)
        .command(require('./updateCommand').default),
}
