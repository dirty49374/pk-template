import { IPkctlDiffOptions, IPkctlApplyOptions } from "../types";
import { Pkz } from '../../pk-lib/pkz';
import { Progress } from "./progress";
import { IObject, IKubeCtlConfig, IResourceKey, delay } from "../../common";
import * as pkyaml from '../../pk-yaml';
import { PkzKube } from "../pkt-kube";
import { PkzSpec } from "../spec";
import { getChalk } from "../../pk-lib/lazy";
import { applyPatch } from "diff";
import { IPkz } from "../../pk-lib/types";

interface IApplyStep {
    name: string;
    objects: IObject[];
    final: boolean;
}

export class ApplyCommand extends Progress {
    private packageName: string;

    private kube: PkzKube;
    private kubeOption: IKubeCtlConfig;

    private wholeOption: string = '';

    constructor(private options: IPkctlApplyOptions) {
        super(options)

        this.kube = null as unknown as PkzKube;
        this.kubeOption = null as unknown as IKubeCtlConfig;
        this.packageName = this.options.packageName.endsWith('.pkz')
            ? this.options.packageName
            : this.options.packageName + '.pkz';
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
        const prevcmap = this.kube.getPkzSpecOrDefault(currcmap.metadata.name);
        const prevSpec = PkzSpec.parse(prevcmap.metadata.name, prevcmap.data.objects);
        const currSpec = PkzSpec.parse(currcmap.metadata.name, currcmap.data.objects);

        return prevSpec.subtract(currSpec);
    }

    private precheckStep(objects: IObject[], steps: IApplyStep[]) {
        this.header('pre-check');
        const chalk = getChalk().yellowBright;
        this.output(`    target deployment : ${chalk(this.packageName)}`);
        this.output(`    kubectl options   : ${chalk(this.wholeOption)} `);
        this.output(`    kubeconfig        : ${chalk(this.kubeOption.kubeconfig)} `);
        this.output(`    cluster           : ${chalk(this.kubeOption.cluster)} `);
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

        if (this.options.sequentialApply) {
            for (const o of step.objects) {
                await this.kube.applyRaw([o], this.wholeOption);
            }
        } else {
            await this.kube.applyRaw(step.objects, this.wholeOption);
        }
        this.output();
    }

    private async apply(pkz: IPkz) {
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
        const objects = pkz.objects.filter(o => o);
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

    buildKubeOption(pkz: IPkz): string {
        let option = ''
        if (pkz.kubeconfig)
            option += ` --kubeconfig ${pkz.kubeconfig}`;
        if (pkz.context)
            option += ` --context ${pkz.context}`;
        if (pkz.cluster)
            option += ` --cluster ${pkz.cluster}`;

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

    async execute() {
        const pkz = Pkz.Load(this.packageName);

        this.kubeOption = {
            kubeconfig: pkz.kubeconfig,
            context: pkz.context,
            cluster: pkz.cluster,
            kube_dryrun_option: this.options.dryRun ? ' --dry-run' : '',
            kube_option: this.buildKubeOption(pkz),
            sequential_apply: false,
        };
        this.kube = new PkzKube(this.kubeOption, this);
        this.wholeOption = `${this.kubeOption.kube_dryrun_option}${this.kubeOption.kube_option}`
        await this.apply(pkz);
    }
}
