import { IObject, IKubeCtlConfig, IResourceKey, delay } from "../common";
import { Progress } from "../pk-ui/progress";
import { PkKubeCtl } from "../pk-kubectl/pk-kubectl";
import * as pkyaml from '../pk-yaml';
import { PkdCatalog } from "./catalog";
import { getChalk } from "../lazy";
import { IPkdApplierOption } from "./options";
import { IPkDeployment } from ".";

interface IApplyStep {
  name: string;
  objects: IObject[];
  final: boolean;
}

export const applyPkd = async (options: IPkdApplierOption, pkz: IPkDeployment) => {

  // const buildApplySteps = (objects: IObject[]): IApplyStep[] => {
  //     const g: IApplyStep[] = [
  //         { name: 'Namespaces', objects: [], final: false },
  //         { name: 'Resources', objects: [], final: false },
  //         { name: 'Deployments', objects: [], final: false },
  //         { name: 'PktPackage', objects: [], final: true },
  //     ];

  //     for (const o of objects) {
  //         if (!o.metadata.namespace) {
  //             const namespaced = kube.isNamespacedObject(o);
  //             if (namespaced) {
  //                 ui.error(`namespace is missing on (kind=${o.kind}, name=${o.metadata.name})`);
  //                 ui.verbose(pkyaml.dumpYaml(o));
  //                 process.exit(1);
  //             }
  //         }

  //         switch (o.kind) {
  //             case 'Namespace':
  //                 g[0].objects.push(o);
  //                 break;

  //             case 'Pod':
  //             case 'Deployment':
  //             case 'DaemonSet':
  //             case 'StatefulSet':
  //                 g[2].objects.push(o);
  //                 break;

  //             default:
  //                 if (o.kind == 'ConfigMap') {
  //                     const name = o.metadata.name;
  //                     const pkgid = o.metadata.annotations && o.metadata.annotations['pkt.io/pkz-id'];
  //                     if (name === pkgid) {
  //                         g[3].objects.push(o);
  //                     } else {
  //                         g[1].objects.push(o);
  //                     }
  //                 } else {
  //                     g[1].objects.push(o);
  //                 }
  //         }
  //     }

  //     return g;
  // }

  // const findDisappearedObjects = (currcmap: IObject): IResourceKey[] => {
  //     const prevcmap = kube.getPkzSpec(currcmap.metadata.name) ||
  //         { metadata: { name: currcmap.metadata.name }, data: { objects: '' } };
  //     const prevSpec = PkdCatalog.parse(prevcmap.metadata.name, prevcmap.data.objects);
  //     const currSpec = PkdCatalog.parse(currcmap.metadata.name, currcmap.data.objects);
  //     return prevSpec.subtract(currSpec);
  // }

  // const precheckStep = (objects: IObject[], steps: IApplyStep[]) => {
  //     ui.header('pre-check');
  //     const chalk = getChalk().yellowBright;
  //     ui.output(`    target deployment : ${chalk(pkz.name)}`);
  //     ui.output(`    kubectl options   :${chalk(wholeOption)} `);
  //     ui.output(`    context           : ${chalk(kubeOption.context)} `);
  //     ui.output(`    apply             : ${chalk(options.dryRun ? 'no' : 'yes')} `);
  //     ui.output();
  //     for (const step of steps) {
  //         ui.output(`    ${step.name.padEnd(15)}: ${step.objects.length} objects`);
  //     }
  //     ui.output();
  //     ui.output(`    total ${objects.length} objects to apply`);
  //     ui.output();
  //     ui.confirm("proceed");
  // }

  // const deleteStep = async (step: IApplyStep) => {
  //     ui.header(`Delete step`);
  //     const deleteList = findDisappearedObjects(step.objects[0]);
  //     const targets = deleteList.map(o => `${o.kind}/${o.namespace}/${o.name}`).join(', ');
  //     if (targets.length == 0) {
  //         ui.verbose('  - targets: none');
  //         ui.info();
  //         ui.confirm('skip');
  //         ui.verbose('  - kubectl: delete skipped');
  //     } else {
  //         ui.verbose(`  - targets: ${targets}`);
  //         ui.verbose()
  //         ui.confirm(`delete ${targets.length} objects`);
  //         ui.verbose('  - kubectl: delete');
  //         kube.deleteObjects(deleteList);
  //         ui.output();
  //     }
  // }

  // const applyStep = async (step: IApplyStep) => {
  //     ui.header(`${step.name} step`);

  //     if (step.objects.length == 0) {
  //         ui.verbose('  - targets: none');
  //         ui.verbose()
  //         ui.confirm(`skip`);
  //         ui.verbose('  - kubectl: apply skipped');
  //         return;
  //     }

  //     const targets = step.objects.map(o => `${o.kind}/${o.metadata.namespace || ''}/${o.metadata.name}`).join(', ');
  //     ui.verbose(`  - targets: ${targets}`);
  //     ui.verbose()
  //     ui.confirm(`apply these ${step.objects.length} objects`);
  //     ui.verbose(`  - kubectl: apply`);

  //     await kube.applyRaw(step.objects, wholeOption);

  //     ui.output();
  // }

  // const buildKubeOption = (pkz: IPkDeployment): string => {
  //     let option = ''
  //     if (pkz.context)
  //         option += ` --context ${pkz.context}`;

  //     return option;
  // }


  // const ui = new Progress(options);
  // const kubeOption = {
  //     context: pkz.context,
  //     kube_dryrun_option: options.dryRun ? ' --dry-run' : '',
  //     kube_option: buildKubeOption(pkz),
  //     sequential_apply: false,
  // };
  // const kube = new PkKubeCtl(kubeOption, ui);
  // const wholeOption = `${kubeOption.kube_dryrun_option}${kubeOption.kube_option}`

  // if (!options.dryRun) {
  //     ui.error('CAUTION) APPLYING TO REAL KUBERNETES CLUSTER !!!');
  //     if (options.yes && !options.immediate) {
  //         for (let i = 10; i >= 0; --i) {
  //             process.stdout.write(`..${i} `);
  //             await delay(500);
  //         }
  //         console.log('.. START !!!');
  //     }
  // }
  // const objects = pkz.objects.filter(o => o);
  // const steps = buildApplySteps(objects);

  // precheckStep(objects, steps);
  // for (const step of steps) {
  //     if (step.final) {
  //         await deleteStep(step);
  //     }
  //     await applyStep(step);
  // }

  // ui.output();
  // ui.success('success !!!');

}
