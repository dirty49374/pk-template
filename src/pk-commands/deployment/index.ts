export default {
    command: 'deployment <command>',
    desc: 'deployment commands',
    builder: (yargs: any) => yargs
        .command(require('./createCommand').default)
    // .command(require('./updateCommand').default),
}
