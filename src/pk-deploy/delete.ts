import { IResourceKey, delay, IKubeCtlConfig } from "../common";
import { Progress } from "../pk-ui/progress";
import { PkKubeCtl } from "../pk-kubectl/pk-kubectl";
import { PkdCatalog } from "./catalog";
import { IPkdApplierOption } from "./options";

export const deletePkd = async (envName: string, cluster: string, options: IPkdApplierOption) => {

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
    const kubeOption: IKubeCtlConfig = {
        cluster: cluster,
        isDryRun: options.dryRun,
        kubeConfig: buildKubeOption(cluster, options),
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

    const spec = kube.getPkzSpec(envName);
    if (!spec) {
        return null;
    }
    const catalog = PkdCatalog.parse(spec.data.catalog);
    if (!catalog) {
        console.error(`cannot find env ${envName} on context ${cluster}`)
        process.exit(1);
        return;
    }
    const packageName = spec.header.name;

    const keys = catalog.getKeys();
    deleteObjects(keys);
    ui.success('success !!!');
}
