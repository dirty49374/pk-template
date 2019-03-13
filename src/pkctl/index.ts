import { CreateCommand } from "./commands/create";
import { UpdateCommand } from "./commands/update";
import { DiffCommand } from "./commands/diff";
import { ApplyCommand } from "./commands/apply";
import { InitCommand } from "./commands/init";
import { AddCommand } from "./commands/add";
import { EnvCommand } from "./commands/env";
import { DeployCommand } from "./commands/deploy";
import { DeleteCommand } from "./commands/delete";


function run(argv: string[], help: boolean) {
    const yargs = require('yargs')(argv)
        .command(CreateCommand)
        .command(UpdateCommand)
        .command(DiffCommand)
        .command(ApplyCommand)
        .command(DeployCommand)
        .command(DeleteCommand)
        .command(EnvCommand)
        .command(InitCommand)
        .command(AddCommand)
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
