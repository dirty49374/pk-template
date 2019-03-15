export default {
    command: 'env <command>',
    desc: 'env commands',
    builder: (yargs: any) => yargs
        .command(require('./setCommand').default)
        .command(require('./listCommand').default)
        .command(require('./showCommand').default),
    // .command(require('./updateCommand').default),
}
