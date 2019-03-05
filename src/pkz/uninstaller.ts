import { IObject, IKubeCtlConfig, IResourceKey, delay } from "../common";
import { Progress } from "../pkctl/commands/progress";
import { PkzKube } from "../pk-kubectl/pkt-kube";
import { IPkctlApplyOptions, IProgressOptions } from "../pkctl/types";
import { IPkz } from "../pk-lib/types";
import * as pkyaml from '../pk-yaml';
import * as Pkz from '.';
import { PkzSpec } from "../pkctl/spec";
import { getChalk } from "../pk-lib/lazy";
import { IPkzApplierOption } from "./options";

interface IDeleteObject {
    apiGroup: string;
    kind: string;
    name: string;
    namespace: string;
}

export class PkzUninstaller extends Progress {
    private kube: PkzKube;
    private kubeOption: IKubeCtlConfig;
    private wholeOption: string = '';

    constructor(private packageName: string, private contextName: string, private options: IPkzApplierOption) {
        super(options);
        this.kubeOption = {
            context: contextName,
            kube_dryrun_option: this.options.dryRun ? ' --dry-run' : '',
            kube_option: this.buildKubeOption(contextName, options),
            sequential_apply: false,
        };
        this.kube = new PkzKube(this.kubeOption, this);
        this.wholeOption = `${this.kubeOption.kube_dryrun_option}${this.kubeOption.kube_option}`
    }

    private loadInstalledSpec(): PkzSpec | null {

        const map = this.kube.getPkzSpec(this.packageName);
        if (!map) {
            return null;
        }
        const spec = PkzSpec.parse(map.metadata.name, map.data.objects);
        return spec
    }

    private async deleteObjects(keys: IResourceKey[]) {
        const nonNamespaces = keys.filter(k => k.kind !== 'Namespace');
        this.kube.deleteObjects(nonNamespaces);

        const namespaces = keys.filter(k => k.kind === 'Namespace');
        this.kube.deleteObjects(namespaces);

        this.kube.deleteObjects([{
            kind: 'ConfigMap',
            apiGroup: 'v1',
            namespace: 'pk-packages',
            name: this.packageName,
        }]);

    }

    buildKubeOption(context: string, options: IPkzApplierOption): string {
        let option = ''
        if (context)
            option += ` --context ${context}`;
        if (options.dryRun)
            option += ` --dry-run`;
        return option;
    }

    async uninstall() {
        if (!this.options.dryRun) {
            this.error('CAUTION) APPLYING TO REAL KUBERNETES CLUSTER !!!');
            if (this.options.yes && !this.options.immediate) {
                for (let i = 10; i >= 0; --i) {
                    process.stdout.write(`..${i} `);
                    await delay(500);
                }
                console.log('.. START !!!');
            }
        }

        const spec = this.loadInstalledSpec();
        if (!spec) {
            console.error(`cannot find package ${this.packageName} on context ${this.contextName}`)
            process.exit(1);
            return;
        }

        const keys = spec.getKeys();
        this.deleteObjects(keys);
        this.success('success !!!');
    }
}
