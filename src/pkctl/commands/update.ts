import { IPkctlUpdateOptions } from "../types";
import { CreateCommand } from './create';
import { Pkz } from '../../pk-lib/pkz';
import { diffObjects } from '../../pk-diff/diff-objects';
import { getReadlineSync, getChalk } from '../../pk-lib/lazy';

export class UpdateCommand {
    private packageNames: string[];

    constructor(private options: IPkctlUpdateOptions) {
        this.packageNames = this.options.packageNames
            .map(n => n.endsWith('.pkz') ? n : n + '.pkz');
    }

    async update(packageName: string) {
        const oldPkz = Pkz.Load(packageName);
        const createCommand = new CreateCommand({
            packageName: oldPkz.name,
            kubeconfig: oldPkz.kubeconfig,
            context: oldPkz.context,
            cluster: oldPkz.cluster,
            _: ['create'].concat(...oldPkz.args),
            yes: true,
            dryRun: true,
        });

        const newPkz = await createCommand.build();
        if (newPkz != null) {
            diffObjects(oldPkz.objects, newPkz.objects);
            if (newPkz.exists() && !this.options.yes) {
                getReadlineSync().question(getChalk().red('are you sure to override ? [ENTER/CTRL-C] '));
            }

            newPkz.save();
            console.log(`${newPkz.name} saved`)
        }
    }

    async execute() {
        for (const packageName of this.packageNames) {
            await this.update(packageName);
        }
    }
}
