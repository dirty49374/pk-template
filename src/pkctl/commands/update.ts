import { IPkctlUpdateOptions } from "../types";
import { CreateCommand } from './create';
import * as Pkz from '../../pkz';
import { diffObjects } from '../../pk-diff/diff-objects';
import { getReadlineSync, getChalk } from '../../pk-lib/lazy';

class Command {
    private packageNames: string[];

    constructor(private options: IPkctlUpdateOptions) {
        this.packageNames = this.options.packageNames
            .map(n => n.endsWith('.pkz') ? n : n + '.pkz');
    }

    async update(packageName: string) {
        // const oldPkz = Pkz.Load(packageName);
        // const createCommand = new CreateCommand({
        //     packageName: oldPkz.name,
        //     context: oldPkz.context,
        //     _: ['create'].concat(...oldPkz.args),
        //     yes: true,
        //     dryRun: true,
        // });

        // const newPkz = await createCommand.build();
        // if (newPkz != null) {
        //     diffObjects(oldPkz.objects, newPkz.objects);
        //     if (newPkz.exists() && !this.options.yes) {
        //         getReadlineSync().question(getChalk().red('are you sure to override ? [ENTER/CTRL-C] '));
        //     }

        //     newPkz.save();
        //     console.log(`${newPkz.name} saved`)
        // }
    }

    async execute() {
        for (const packageName of this.packageNames) {
            await this.update(packageName);
        }
    }
}

export const UpdateCommand = {
    command: 'update <package-names..>',
    desc: 'update a package',
    builder: (yargs: any) => yargs
        .option('yes', { describe: 'overwrite without confirmation', boolean: true })
        .positional('package-names', { describe: 'list of packages to update', }),
    handler: (argv: any) => new Command(argv).execute(),
};
