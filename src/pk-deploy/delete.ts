import { IResourceKey, delay, IKubeCtlConfig } from "../common";
import { Progress } from "../pk-ui/progress";
import { PkKubeCtl } from "../pk-kubectl/pk-kubectl";
import { PkdCatalog } from "./catalog";
import { IPkdApplierOption } from "./options";
import { homedir } from "os";
import { join } from "path";

export const deletePkd = async (projectName: string, appName: string, envName: string, cluster: string, options: IPkdApplierOption) => {
    const deploymentName = `${projectName}-${appName}-${envName}`;

    const deleteObjects = async (keys: IResourceKey[]) => {
        const nonNamespaces = keys.filter(k => k.kind !== 'Namespace');
        kube.deleteObjects(nonNamespaces);

        const namespaces = keys.filter(k => k.kind === 'Namespace');
        kube.deleteObjects(namespaces);

        kube.deleteObjects([{
            kind: 'ConfigMap',
            apiGroup: 'v1',
            namespace: 'pk-deployments',
            name: deploymentName,
        }]);
    }

    const ui = new Progress(options);
    const kubeOption: IKubeCtlConfig = {
        cluster: cluster,
        isDryRun: options.dryRun,
        kubeConfig: join(homedir(), '.kube', cluster),
    };
    const kube = new PkKubeCtl(kubeOption, ui);

    if (!options.dryRun) {
        ui.error('CAUTION) APPLYING TO REAL KUBERNETES CLUSTER !!!');
        if (options.yes && !options.immediate) {
            for (let i = 10; i >= 0; --i) {
                process.stdout.write(`..${i} `);
                console.log('await')
                await delay(500);
            }
            console.log('.. START !!!');
        }
    }

    const spec = kube.getPkzSpec(deploymentName);
    if (!spec) {
        console.log('no spec');
        return null;
    }
    const catalog = PkdCatalog.parse(spec.data.catalog);
    if (!catalog) {
        console.error(`cannot find env ${envName} on context ${cluster}`)
        process.exit(1);
        return;
    }
    const packageName = spec.data.header.name;

    const keys = catalog.getKeys();
    deleteObjects(keys);
    ui.success('success !!!');
}
