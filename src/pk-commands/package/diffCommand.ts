import { IPkctlDiffOptions } from "../types";
import { loadPkd } from '../../pk-deploy/load';
import { generate } from "../../pkt/pkt";
import { diffObjects } from "../../pk-diff/diff-objects";
import { buildPkd } from "../../pk-deploy/build";

class Command {
    // private packageName: string;

    // constructor(private options: IPkctlDiffOptions) {
    //     this.packageName = this.options.packageName.endsWith('.pkz')
    //         ? this.options.packageName.substr(0, this.options.packageName.length - 4)
    //         : this.options.packageName;
    // }

    // async execute() {
    //     const oldPkz = loadPkd(this.packageName);
    //     const result = await generate(oldPkz.args);
    //     if (!result) {
    //         throw new Error(`failed to update package ${this.packageName}`);
    //     }
    //     const newPkz = buildPkd(
    //         this.packageName,
    //         this.options.context,
    //         result.args,
    //         result.objects
    //     );

    //     if (newPkz != null) {
    //         diffObjects(oldPkz.objects, newPkz.objects);
    //     }
    // }
}

export default {
    command: 'diff <package-name>',
    desc: 'diff a package',
    builder: (yargs: any) => yargs
        .positional('package-name', { describe: 'a package name', }),
    handler: (argv: any) => 1//new Command(argv).execute(),
};
