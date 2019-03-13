import { generate } from '../../pkt/pkt';
import { IPkctlUpdateOptions } from "../types";
import { diffObjects } from '../../pk-diff/diff-objects';
import { getReadlineSync, getChalk } from '../../lazy';
import { buildPkd } from '../../pk-deploy/build';
import { loadPkd } from '../../pk-deploy/load';
import { savePkd } from '../../pk-deploy/save';
import { existsPkd } from '../../pk-deploy/exists';

class Command {
    // private packageNames: string[];

    // constructor(private options: IPkctlUpdateOptions) {
    //     this.packageNames = this.options.packageNames
    //         .map(n => n.endsWith('.pkz') ? n.substr(0, n.length - 4) : n);
    // }

    // async update(packageName: string) {
    //     const oldPkz = loadPkd(packageName);
    //     const result = await generate(oldPkz.args);
    //     if (!result) {
    //         throw new Error(`failed to update package ${packageName}`);
    //     }
    //     const newPkz = buildPkd(
    //         packageName,
    //         this.options.context,
    //         result.args,
    //         result.objects
    //     );

    //     if (newPkz != null) {
    //         diffObjects(oldPkz.objects, newPkz.objects);
    //         if (existsPkd(newPkz) && !this.options.yes) {
    //             getReadlineSync().question(getChalk().red('are you sure to override ? [ENTER/CTRL-C] '));
    //         }

    //         savePkd(newPkz);
    //         console.log(`${newPkz.name}.pkz saved`)
    //     }
    // }

    // async execute() {
    //     for (const packageName of this.packageNames) {
    //         console.log(`* updating ${packageName} ...`);
    //         console.log();
    //         await this.update(packageName);
    //     }
    // }
}

export default {
    command: 'update <package-names..>',
    desc: 'update a package',
    builder: (yargs: any) => yargs
        .option('yes', { describe: 'overwrite without confirmation', boolean: true })
        .positional('package-names', { describe: 'list of packages to update', }),
    handler: (argv: any) => 1 //new Command(argv).execute(),
};
