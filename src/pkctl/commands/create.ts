import { execute } from "../../pkt/pkt";
import { IObject } from "../../common";
import { IPktCreateOptions } from "../types";
import * as Pkz from '../../pkz';
import { getChalk, getReadlineSync } from '../../pk-lib/lazy';
import { IPkz } from "../../pk-lib/types";

export class CreateCommand {
    private args: string[];
    private packageName: string;

    constructor(private options: IPktCreateOptions) {
        this.args = options._.slice(1);
        this.packageName = this.options.packageName.endsWith('.pkz')
            ? this.options.packageName
            : this.options.packageName + '.pkz';
    }


    async build(): Promise<IPkz | null> {
        const result = await execute(this.args, false);
        return result != null
            ? Pkz.build(
                this.options.packageName,
                this.options.context,
                result.args,
                result.objects
            )
            : null;
    }

    async execute(): Promise<any> {
        const pkz = await this.build();
        if (pkz != null) {
            if (Pkz.exists(pkz) && !this.options.yes) {
                getReadlineSync().question(getChalk().red(`file already exists, are you sure to overwrite ? [ENTER/CTRL-C] `));
            }
            Pkz.save(pkz);
            console.log(getChalk().green(`${this.packageName} created`));
        } else {
            console.error(getChalk().red(`failed to create package ${this.packageName}`));
        }
    }
}
