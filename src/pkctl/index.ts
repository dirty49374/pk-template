import { CreateCommand } from "./commands/create";
import { UpdateCommand } from "./commands/update";
import { DiffCommand } from "./commands/diff";
import { ApplyCommand } from "./commands/apply";

type Argv = any;

function run(argv: string[], help: boolean) {
    const yargs = require('yargs')(argv)
        .command(
            'create <package-name>',
            'create a package',
            (yargs: Argv) => yargs
                .option('kubeconfig')
                .option('context')
                .option('cluster')
                .option('yes', { describe: 'overwrite without confirmation', boolean: true })
                .positional('package-name', { describe: 'a package name to craete', }),
            (argv: any) => {
                new CreateCommand(argv).execute();
            })
        .command(
            'update <package-name>',
            'update a package',
            (yargs: Argv) => yargs
                .option('yes', { describe: 'overwrite without confirmation', boolean: true })
                .positional('package-name', { describe: 'a package name', }),
            (argv: any) => {
                new UpdateCommand(argv).execute();
            })
        .command(
            'diff <package-name>',
            'diff a package',
            (yargs: Argv) => yargs
                .positional('package-name', { describe: 'a package name', }),
            (argv: any) => {
                new DiffCommand(argv).execute();
            })
        .command(
            'apply <package-name>',
            'apply a package',
            (yargs: Argv) => yargs
                .option('dry-run', { describe: 'dry run', boolean: true })
                .option('immediate', { describe: 'execute immediately without initial 5 seconds delay', boolean: true })
                .option('yes', { describe: 'overwrite without confirmation', boolean: true })
                .positional('package-name', { describe: 'a package name', }),
            (argv: any) => {
                new ApplyCommand(argv).execute();
            })
        .demandCommand();
    if (help) {
        yargs.showHelp();
    } else {
        yargs.argv;
    }
}

async function main(argv: string[]) {
    if (argv.length < 2) {
        await run(argv, true);
        return;
    }

    switch (argv[0]) {
        case 'diff':
        case 'apply':
        case 'update':
        case 'create':
            await run(argv, false);
            break;
        default:
            await run(argv, true);
    }
}

main(process.argv.slice(2));
