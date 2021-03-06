import { IResourceKey, delay, IKubeCtlConfig } from "../common";
import { Progress } from "../pk-ui/progress";
import { PkKubeCtl } from "../pk-kubectl/pk-kubectl";
import { PkdCatalog } from "./catalog";
import { IPkdApplierOption } from "./options";
import { homedir } from "os";
import { join } from "path";

export const deletePkd = async (projectName: string, appName: string, envName: string, clusterName: string, options: IPkdApplierOption) => {
  const deploymentName = `${projectName}-${appName}-${envName}-${clusterName}`;

  const deleteObjects = async (keys: IResourceKey[]) => {
    const nonNamespaces = keys.filter(k => k.kind !== 'Namespace');
    kube.deleteObjects(nonNamespaces);

    const namespaces = keys.filter(k => k.kind === 'Namespace' && k.name !== 'default');
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
    cluster: clusterName,
    isDryRun: options.dryRun,
    kubeConfig: join(homedir(), '.kube', clusterName),
  };
  const kube = new PkKubeCtl(kubeOption, ui);

  if (!options.dryRun) {
    ui.error('CAUTION) APPLYING TO REAL KUBERNETES CLUSTER !!!');
    if (options.yes && !options.immediate) {
      for (let i = 10; i >= 0; --i) {
        process.stdout.write(`..${i} `);
        await delay(200);
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
    console.error(`cannot find env ${envName} on context ${clusterName}`)
    process.exit(1);
    return;
  }

  const keys = catalog.getKeys();
  deleteObjects(keys);
  ui.success('success !!!');
}
