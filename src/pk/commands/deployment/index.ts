export default {
    command: 'deployment <command>',
    desc: 'deployment commands',
    builder: (yargs: any) => yargs
        .command(require('./addCommand').default)
        .command(require('./diffCommand').default)
        .command(require('./updateCommand').default)
        .command(require('./applyCommand').default),
}
