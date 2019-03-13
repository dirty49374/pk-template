import { initCommands } from "../pk-commands";

function run(argv: string[], help: boolean) {
    const yargs = initCommands(require('yargs')(argv))
        .demandCommand()

    if (help) {
        yargs.showHelp();
    } else {
        yargs.recommendCommands().strict().help('h').argv;
    }
}

async function main(argv: string[]) {
    switch (argv[0]) {
        case 'apply':
            if (argv.length < 2) {
                await run(argv, true);
                return;
            }
    }
    await run(argv, false);
}

main(process.argv.slice(2));
