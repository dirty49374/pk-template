export const initCommands = (yargs: any): any => yargs
    // .command(require('./createCommand').default)
    // .command(require('./updateCommand').default)
    // .command(require('./diffCommand').default)
    // .command(require('./applyCommand').default)
    // .command(require('./initCommand').default)
    // .command(require('./addCommand').default)
    // .command(require('./envCommand').default)
    // .command(require('./deployCommand').default)
    // .command(require('./deleteCommand').default)
    .command(require('./init').default)
    .command(require('./module').default)
    .command(require('./package').default)
    ;
