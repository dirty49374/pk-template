import { execCommand } from '../../pkt/pkt';
import { IPktCreateOptions } from './../types';
import * as PkDeploy from '../../pk-deploy';
import { getChalk, getReadlineSync } from '../../lazy';
import { buildPkd } from '../../pk-deploy/build';
import { savePkd } from '../../pk-deploy/save';
import { existsPkd } from '../../pk-deploy/exists';

export class Command {
    // private args: string[];
    // private packageName: string;

    // constructor(private options: IPktCreateOptions) {
    //     console.log(this.options);
    //     this.args = options._.slice(2);
    //     this.packageName = this.options.packageName.endsWith('.pkz')
    //         ? this.options.packageName
    //         : this.options.packageName + '.pkz';
    // }


    // async build(): Promise<PkDeploy.IPkDeployment | null> {
    //     const result = await execCommand(this.args, false);
    //     return result != null
    //         ? buildPkd(
    //             this.options.packageName,
    //             this.options.context,
    //             result.args,
    //             result.objects
    //         )
    //         : null;
    // }

    // async execute(): Promise<any> {
    //     const pkz = await this.build();
    //     if (pkz != null) {
    //         if (existsPkd(pkz) && !this.options.yes) {
    //             getReadlineSync().question(getChalk().red(`file already exists, are you sure to overwrite ? [ENTER/CTRL-C] `));
    //         }
    //         savePkd(pkz);
    //         console.log(getChalk().green(`${this.packageName} created`));
    //     } else {
    //         console.error(getChalk().red(`failed to create package ${this.packageName}`));
    //     }
    // }
}

export default {
    command: 'create <package-name>',
    desc: 'create a package',
    builder: (yargs: any) => yargs
        .option('kubeconfig')
        .option('context')
        .option('cluster')
        .option('yes', { describe: 'overwrite without confirmation', boolean: true })
        .positional('package-name', { describe: 'a package name to craete', }),
    handler: (argv: any) => 1//new Command(argv).execute(),
};
