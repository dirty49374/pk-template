import { IKubeCtlConfig, IResourceKey, delay } from "../common";
import { Progress } from "../pk-ui/progress";
import { PkKubeCtl } from "../pk-kubectl/pk-kubectl";
import { PkdCatalog } from "./catalog";
import { IPkdApplierOption } from "./options";

export const deletePkd = async (packageName: string, contextName: string, options: IPkdApplierOption) => {

    const loadInstalledSpec = (): PkdCatalog | null => {
        const map = kube.getPkzSpec(packageName);
        if (!map) {
            return null;
        }
        const spec = PkdCatalog.parse(map.metadata.name, map.data.objects);
        return spec
    }

    const deleteObjects = async (keys: IResourceKey[]) => {
        const nonNamespaces = keys.filter(k => k.kind !== 'Namespace');
        kube.deleteObjects(nonNamespaces);

        const namespaces = keys.filter(k => k.kind === 'Namespace');
        kube.deleteObjects(namespaces);

        kube.deleteObjects([{
            kind: 'ConfigMap',
            apiGroup: 'v1',
            namespace: 'pk-deployments',
            name: packageName,
        }]);

    }

    const buildKubeOption = (context: string, options: IPkdApplierOption): string => {
        let option = ''
        if (context)
            option += ` --context ${context}`;
        if (options.dryRun)
            option += ` --dry-run`;
        return option;
    }


    const ui = new Progress(options);
    const kubeOption = {
        context: contextName,
        kube_dryrun_option: options.dryRun ? ' --dry-run' : '',
        kube_option: buildKubeOption(contextName, options),
        sequential_apply: false,
    };
    const kube = new PkKubeCtl(kubeOption, ui);

    if (!options.dryRun) {
        ui.error('CAUTION) APPLYING TO REAL KUBERNETES CLUSTER !!!');
        if (options.yes && !options.immediate) {
            for (let i = 10; i >= 0; --i) {
                process.stdout.write(`..${i} `);
                await delay(500);
            }
            console.log('.. START !!!');
        }
    }

    const spec = loadInstalledSpec();
    if (!spec) {
        console.error(`cannot find package ${packageName} on context ${contextName}`)
        process.exit(1);
        return;
    }

    const keys = spec.getKeys();
    deleteObjects(keys);
    ui.success('success !!!');
}
