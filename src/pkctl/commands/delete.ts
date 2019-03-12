import { IPkctlDeleteOptions } from "../types";
import * as Pkz from '../../pkz';
import { unsetExt } from "../../common";
import { PktModule } from "../../pk-lib/module";

export class DeleteCommand {
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
