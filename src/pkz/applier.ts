import { IObject, IKubeCtlConfig, IResourceKey, delay } from "../common";
import { Progress } from "../pk-ui/progress";
import { PkzKube } from "../pk-kubectl/pkt-kube";
import { IPkctlApplyOptions, IProgressOptions } from "../pkctl/types";
import { IPkz } from "../pk-lib/types";
import * as pkyaml from '../pk-yaml';
import * as Pkz from '../pkz';
import { PkzSpec } from "../pkctl/spec";
import { getChalk } from "../pk-lib/lazy";
import { IPkzApplierOption } from "./options";

interface IApplyStep {
    name: string;
    objects: IObject[];
    final: boolean;
}

export class PkzApplier extends Progress {
    private kube: PkzKube;
    private kubeOption: IKubeCtlConfig;
    private wholeOption: string = '';

    constructor(private options: IPkzApplierOption, private pkz: IPkz) {
        super(options);
        this.kubeOption = {
            context: pkz.context,
            kube_dryrun_option: this.options.dryRun ? ' --dry-run' : '',
            kube_option: this.buildKubeOption(pkz),
            sequential_apply: false,
        };
        this.kube = new PkzKube(this.kubeOption, this);
        this.wholeOption = `${this.kubeOption.kube_dryrun_option}${this.kubeOption.kube_option}`
    }

    private buildApplySteps(objects: IObject[]): IApplyStep[] {
        const g: IApplyStep[] = [
            { name: 'Namespaces', objects: [], final: false },
            { name: 'Resources', objects: [], final: false },
            { name: 'Deployments', objects: [], final: false },
            { name: 'PktPackage', objects: [], final: true },
        ];

        for (const o of objects) {
            if (!o.metadata.namespace) {
                const namespaced = this.kube.isNamespacedObject(o);
                if (namespaced) {
                    this.error(`namespace is missing on (kind=${o.kind}, name=${o.metadata.name})`);
                    this.verbose(pkyaml.dumpYaml(o));
                    process.exit(1);
                }
            }

            switch (o.kind) {
                case 'Namespace':
                    g[0].objects.push(o);
                    break;

                case 'Pod':
                case 'Deployment':
                case 'DaemonSet':
                case 'StatefulSet':
                    g[2].objects.push(o);
                    break;

                default:
                    if (o.kind == 'ConfigMap') {
                        const name = o.metadata.name;
                        const pkgid = o.metadata.annotations && o.metadata.annotations['pkt.io/pkz-id'];
                        if (name === pkgid) {
                            g[3].objects.push(o);
                        } else {
                            g[1].objects.push(o);
                        }
                    } else {
                        g[1].objects.push(o);
                    }
            }
        }

        return g;
    }

    private findDisappearedObjects(currcmap: IObject): IResourceKey[] {
        const prevcmap = this.kube.getPkzSpec(currcmap.metadata.name) ||
            { metadata: { name: currcmap.metadata.name }, data: { objects: '' } };
        const prevSpec = PkzSpec.parse(prevcmap.metadata.name, prevcmap.data.objects);
        const currSpec = PkzSpec.parse(currcmap.metadata.name, currcmap.data.objects);
        return prevSpec.subtract(currSpec);
    }

    private precheckStep(objects: IObject[], steps: IApplyStep[]) {
        this.header('pre-check');
        const chalk = getChalk().yellowBright;
        this.output(`    target deployment : ${chalk(this.pkz.name)}`);
        this.output(`    kubectl options   :${chalk(this.wholeOption)} `);
        this.output(`    context           : ${chalk(this.kubeOption.context)} `);
        this.output(`    apply             : ${chalk(this.options.dryRun ? 'no' : 'yes')} `);
        this.output();
        for (const step of steps) {
            this.output(`    ${step.name.padEnd(15)}: ${step.objects.length} objects`);
        }
        this.output();
        this.output(`    total ${objects.length} objects to apply`);
        this.output();
        this.confirm("proceed");
    }

    private async deleteStep(step: IApplyStep) {
        this.header(`Delete step`);
        const deleteList = this.findDisappearedObjects(step.objects[0]);
        const targets = deleteList.map(o => `${o.kind}/${o.namespace}/${o.name}`).join(', ');
        if (targets.length == 0) {
            this.verbose('  - targets: none');
            this.info();
            this.confirm('skip');
            this.verbose('  - kubectl: delete skipped');
        } else {
            this.verbose(`  - targets: ${targets}`);
            this.verbose()
            this.confirm(`delete ${targets.length} objects`);
            this.verbose('  - kubectl: delete');
            this.kube.deleteObjects(deleteList);
            this.output();
        }
    }

    private async applyStep(step: IApplyStep) {
        this.header(`${step.name} step`);

        if (step.objects.length == 0) {
            this.verbose('  - targets: none');
            this.verbose()
            this.confirm(`skip`);
            this.verbose('  - kubectl: apply skipped');
            return;
        }

        const targets = step.objects.map(o => `${o.kind}/${o.metadata.namespace || ''}/${o.metadata.name}`).join(', ');
        this.verbose(`  - targets: ${targets}`);
        this.verbose()
        this.confirm(`apply these ${step.objects.length} objects`);
        this.verbose(`  - kubectl: apply`);

        await this.kube.applyRaw(step.objects, this.wholeOption);

        this.output();
    }

    buildKubeOption(pkz: IPkz): string {
        let option = ''
        if (pkz.context)
            option += ` --context ${pkz.context}`;

        // config.kube_option = option;
        // if (args.apply) {
        //     config.apply = args.apply;
        // }

        // config.already_confirmed = !!args.yes;
        // if (!config.apply) {
        //     config.kube_dryrun_option = ' --dry-run';
        //     // config.already_confirmed = true;
        // }

        // config.sequential_apply = !!args.single;

        return option;
    }

    async apply() {
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
        const objects = this.pkz.objects.filter(o => o);
        const steps = this.buildApplySteps(objects);

        this.precheckStep(objects, steps);
        for (const step of steps) {
            if (step.final) {
                await this.deleteStep(step);
            }
            await this.applyStep(step);
        }

        this.output();
        this.success('success !!!');
    }
}
