import fs from 'fs';
import { ApplyConfig } from "./types";
import * as pkyaml from '../pk-yaml';
import { getChalk } from '../pk-lib/lazy';
import { Progress } from './progress';
import { PkzKube } from './pkt-kube';
import { IResourceKey, IObject, delay } from '../common';
import { PkzSpec } from './spec';
import pkzheader from './pkz-header';

interface IApplyStep {
    name: string;
    objects: IObject[];
    final: boolean;
}

export class PkgApply extends Progress {
    private kube: PkzKube;
    private wholeOption: string = '';
    constructor(config: ApplyConfig) {
        super(config);
        this.kube = new PkzKube(config, this);
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
        this.output(`    target deployment : ${chalk(this.config.target)}`);
        this.output(`    kubectl options   : ${chalk(this.wholeOption)} `);
        this.output(`    kubeconfig        : ${chalk(this.config.kubeconfig)} `);
        this.output(`    cluster           : ${chalk(this.config.cluster)} `);
        this.output(`    context           : ${chalk(this.config.context)} `);
        this.output(`    apply             : ${chalk(this.config.apply ? 'yes' : 'no')} `);
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

        if (this.config.sequential_apply) {
            for (const o of step.objects) {
                await this.kube.applyRaw([o], this.wholeOption);
            }
        } else {
            await this.kube.applyRaw(step.objects, this.wholeOption);
        }
        this.output();
    }

    private async apply(content: string) {
        if (this.config.apply) {
            this.error('CAUTION) APPLYING TO REAL KUBERNETES CLUSTER !!!');
            if (this.config.already_confirmed) {
                for (let i = 10; i >= 0; --i) {
                    process.stdout.write(`..${i} `);
                    await delay(500);
                }
                console.log('.. START !!!');
            }
        }
        const objects = pkyaml.loadYamlAll(content).filter(o => o);
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

    async exec(target: string) {
        const content = fs.readFileSync(target, 'utf8');
        pkzheader.parse(content, this.config);
        this.wholeOption = `${this.config.kube_dryrun_option}${this.config.kube_option}`;

        await this.apply(content);
    }
}
