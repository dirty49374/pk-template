import { IPkctlDeployOptions } from "../types";
import { loadYamlFile } from '../../pk-yaml';
import * as Pkt from '../../pkt/pkt';
import * as Pkz from '../../pkz';
import { unsetExt } from "../../common";
import { IResult as IPktResult } from "../../pk-lib/types";

class Command {
    constructor(private options: IPkctlDeployOptions) {
    }

    async buildObjects(): Promise<IPktResult> {
        const specName = this.options.specName.toLowerCase().endsWith('.pks')
            ? this.options.specName
            : this.options.specName + '.pks';
        const spec = loadYamlFile(specName);
        const args = {
            files: spec.files,
            values: spec.values,
            options: {
                env: this.options.envName,
            },
        };
        const result = await Pkt.execCommand(args, false);
        if (!result) {
            process.exit(1);
            // @ts-ignore
            return null;
        }
        return result;
    }

    async execute() {
        const pkzName = unsetExt(this.options.specName, ".pks");
        const result = await this.buildObjects();
        if (result.env == null) {
            throw new Error('unknown env')
        }

        const pkz = Pkz.build(
            pkzName,
            result.env.context,
            result.args,
            result.objects,
        )

        await Pkz.deploy(pkz, {
            yes: this.options.yes,
            dryRun: this.options.dryRun,
            immediate: this.options.immediate,
        })
    }
}

export const DeployCommand = {
    command: 'deploy <spec-name> <env-name>',
    desc: 'deploy spec to env',
    builder: (yargs: any) => yargs
        .option('dry-run', { describe: 'dry run', boolean: true })
        .option('immediate', { describe: 'execute immediately without initial 5 seconds delay', boolean: true })
        .option('yes', { describe: 'overwrite without confirmation', boolean: true })
        .positional('spec-name', { describe: 'a spec name', })
        .positional('env-name', { describe: 'an environment name', }),
    handler: (argv: any) => new Command(argv).execute(),
};
