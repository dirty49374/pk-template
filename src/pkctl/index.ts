import { CreateCommand } from "./commands/create";
import { UpdateCommand } from "./commands/update";
import { DiffCommand } from "./commands/diff";
import { ApplyCommand } from "./commands/apply";
import { InitCommand } from "./commands/init";
import { AddCommand } from "./commands/add";
import { EnvCommand } from "./commands/env";

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
            'update <package-names..>',
            'update a package',
            (yargs: Argv) => yargs
                .option('yes', { describe: 'overwrite without confirmation', boolean: true })
                .positional('package-names', { describe: 'list of packages to update', }),
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
        .command(
            'env <env-name> <context-name>',
            'add or update env',
            (yargs: Argv) => yargs,
            (argv: any) => {
                new EnvCommand(argv).execute();
            })
        .command(
            'init',
            'init a module',
            (yargs: Argv) => yargs,
            (argv: any) => {
                new InitCommand(argv).execute();
            })
        .command(
            'add <repository-name> <repository-uri>',
            'add a remote module',
            (yargs: Argv) => yargs,
            (argv: any) => {
                new AddCommand(argv).execute();
            })
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
