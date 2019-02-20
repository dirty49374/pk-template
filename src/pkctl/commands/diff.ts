import { IPkctlDiffOptions } from "../types";
import { CreateCommand } from './create';
import { Pkz } from '../../pk-lib/pkz';
import { diffObjects } from '../../pk-diff/diff-objects';

export class DiffCommand {
    private packageName: string;

    constructor(private options: IPkctlDiffOptions) {
        this.packageName = this.options.packageName.endsWith('.pkz')
            ? this.options.packageName
            : this.options.packageName + '.pkz';
    }

    async execute() {
        const oldPkz = Pkz.Load(this.packageName);
        const createCommand = new CreateCommand({
            packageName: oldPkz.name,
            kubeconfig: this.options.kubeconfig,
            context: this.options.context,
            cluster: this.options.cluster,
            _: ['create'].concat(...oldPkz.args),
            yes: true,
            dryRun: true,
        });

        const newPkz = await createCommand.build();
        if (newPkz != null) {
            diffObjects(oldPkz.objects, newPkz.objects);
        }
    }
}
