import { IPkctlUpdateOptions } from "../types";
import { CreateCommand } from './create';
import { Pkz } from '../../pk-lib/pkz';
import { diffObjects } from '../../pk-diff/diff-objects';
import { getReadlineSync, getChalk } from '../../pk-lib/lazy';

export class UpdateCommand {
    private packageName: string;

    constructor(private options: IPkctlUpdateOptions) {
        this.packageName = this.options.packageName.endsWith('.pkz')
            ? this.options.packageName
            : this.options.packageName + '.pkz';
    }

    async execute() {
        const oldPkz = Pkz.Load(this.packageName);
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
}
