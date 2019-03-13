import { IPkctlDiffOptions } from "../types";
import { CreateCommand } from './create';
import * as Pkz from '../../pkz';
import { diffObjects } from '../../pk-diff/diff-objects';

class Command {
    private packageName: string;

    constructor(private options: IPkctlDiffOptions) {
        this.packageName = this.options.packageName.endsWith('.pkz')
            ? this.options.packageName
            : this.options.packageName + '.pkz';
    }

    async execute() {
        // const oldPkz = Pkz.Load(this.packageName);
        // const createCommand = new CreateCommand({
        //     packageName: oldPkz.name,
        //     context: this.options.context,
        //     _: ['create'].concat(...oldPkz.args),
        //     yes: true,
        //     dryRun: true,
        // });

        // const newPkz = await createCommand.build();
        // if (newPkz != null) {
        //     diffObjects(oldPkz.objects, newPkz.objects);
        // }
    }
}

export const DiffCommand = {
    command: 'diff <package-name>',
    desc: 'diff a package',
    builder: (yargs: any) => yargs
        .positional('package-name', { describe: 'a package name', }),
    handler: (argv: any) => new Command(argv).execute(),
};
