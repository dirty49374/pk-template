export default {
    command: 'package <command>',
    desc: 'manage a package',
    builder: (yargs: any) => yargs
        .command(require('./createCommand').default)
        .command(require('./updateCommand').default)
        .command(require('./diffCommand').default),
}
