import { IPkctlDeleteOptions } from "../types";
import * as Pkz from '../../pkz';
import { unsetExt } from "../../common";
import { PktModule } from "../../pk-lib/module";

class Command {
    constructor(private options: IPkctlDeleteOptions) {
    }

    async execute() {
        const pkzName = unsetExt(unsetExt(this.options.packageName, ".pks"), ".pkz");
        const mod = PktModule.Load(pkzName);
        if (mod == null) {
            console.error('no module context, pkt.conf not exists')
            process.exit(1);
            return;
        }

        const env = mod.module.envs.find(e => e.name == this.options.envName);
        if (!env) {
            console.error(`env '${this.options.envName}' does not exists`);
            process.exit(1);
            return;
        }

        Pkz.uninstall(pkzName, env.context, this.options);
    }
}

export const DeleteCommand = {
    command: 'delete <package-name> <env-name>',
    desc: 'delete package from env',
    builder: (yargs: any) => yargs
        .option('dry-run', { describe: 'dry run', boolean: true })
        .option('immediate', { describe: 'execute immediately without initial 5 seconds delay', boolean: true })
        .option('yes', { describe: 'overwrite without confirmation', boolean: true })
        .positional('package-name', { describe: 'a package name', })
        .positional('env-name', { describe: 'an environment name', }),
    handler: (argv: any) => new Command(argv).execute(),
};
