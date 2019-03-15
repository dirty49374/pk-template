import { IPkctlApplyOptions } from '../../types';
import { Progress } from '../../../pk-ui/progress';
import { IObject, IKubeCtlConfig, IResourceKey, delay } from '../../../common';
import * as pkyaml from '../../../pk-yaml';
import { PkKubeCtl } from '../../../pk-kubectl/pk-kubectl';
import { PkdCatalog } from '../../../pk-deploy/catalog';
import { getChalk } from '../../../lazy';
import { loadPkd } from '../../../pk-deploy/load';
import { IPkDeployment } from '../../../pk-deploy';
import { join } from 'path';
import { homedir } from 'os';
import { visitEachAppAndEnv } from '../../libs';

interface IApplyStep {
    name: string;
    objects: IObject[];
    final: boolean;
}

class Command extends Progress {
    private packageName: string | null;

    private kube: PkKubeCtl;
    private kubeOption: IKubeCtlConfig;

    constructor(private options: IPkctlApplyOptions, private app: string, private env: string) {
        super(options)

        this.kube = null as unknown as PkKubeCtl;
        this.kubeOption = null as unknown as IKubeCtlConfig;
        this.packageName = null;
    }

    private buildApplySteps(objects: IObject[]): IApplyStep[] {
        const g: IApplyStep[] = [
            { name: 'Namespaces', objects: [], final: false },
            { name: 'Resources', objects: [], final: false },
            { name: 'Deployments', objects: [], final: false },
            { name: 'Catalog', objects: [], final: true },
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
                        const type = o.metadata.annotations &&
                            o.metadata.annotations['pkt.io/type'];
                        if (type === 'pk-deployment') {
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
            { metadata: { name: currcmap.metadata.name }, data: { catalog: '', header: {} } };
        const prevSpec = PkdCatalog.parse(prevcmap.data.catalog);
        const currSpec = PkdCatalog.parse(currcmap.data.catalog);

        return prevSpec.subtract(currSpec);
    }

    private precheckStep(objects: IObject[], steps: IApplyStep[]) {
        this.header('pre-check');
        const chalk = getChalk().yellowBright;
        this.output(`    target deployment : ${chalk(this.packageName)}`);
        this.output(`    kubeconfig        : ${chalk(this.kubeOption.kubeConfig)} `);
        this.output(`    cluster           : ${chalk(this.kubeOption.cluster)} `);
        this.output(`    apply             : ${chalk(this.kubeOption.isDryRun ? 'no' : 'yes')} `);
        this.output();
        for (const step of steps) {
            this.output(`    ${step.name.padEnd(15)}: ${step.objects.length} objects`);
        }
        this.output();
        this.output(`    total ${objects.length} objects to apply`);
        this.output();
        this.confirm("proceed");
    }

    private showTargets(targets: IObject[]) {
        if (targets.length == 0) {
            this.verbose('  - targets: none');
        } else {
            this.verbose(`  - targets:`);
            const kmax = targets.reduce((max, target) => max = Math.max(max, target.kind.length), 0);
            const nmax = targets.reduce((max, target) => max = Math.max(max, target.metadata.name.length), 0);
            for (const target of targets) {
                const name = target.metadata.namespace
                    ? `${target.kind.padEnd(kmax)}  ${target.metadata.name.padEnd(nmax)}  namespace = ${target.metadata.namespace}`
                    : `${target.kind.padEnd(kmax)}  ${target.metadata.name.padEnd(nmax)}`;
                this.verbose(`    ${name}`);
            }
        }
        this.verbose();
    }

    private async deleteStep(step: IApplyStep) {
        this.header(`Delete step`);

        const deleteList = this.findDisappearedObjects(step.objects[0]);
        const targets = deleteList;
        if (targets.length == 0) {
            this.showTargets(targets);
            this.confirm('skip');
            this.verbose('  - kubectl: delete skipped');
        } else {
            this.showTargets(targets);
            this.confirm(`delete ${targets.length} objects`);
            this.verbose('  - kubectl: delete');
            this.kube.deleteObjects(deleteList);
            this.output();
        }
    }

    private async applyStep(step: IApplyStep) {
        this.header(`${step.name} step`);

        if (step.objects.length == 0) {
            this.showTargets([]);
            this.confirm(`skip`);
            this.verbose('  - kubectl: apply skipped');
            return;
        }

        this.showTargets(step.objects);
        this.confirm(`apply these ${step.objects.length} objects`);
        this.verbose(`  - kubectl: apply`);

        if (this.options.sequentialApply) {
            for (const o of step.objects) {
                await this.kube.applyRaw(this.kubeOption, [o]);
            }
        } else {
            await this.kube.applyRaw(this.kubeOption, step.objects);
        }
        this.output();
    }

    private async apply(pkz: IPkDeployment) {
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
        const objects = pkz.objects.filter((o: any) => o);
        const steps = this.buildApplySteps(objects);

        this.precheckStep(objects, steps);
        for (const step of steps) {
            if (step.final) {
                await this.deleteStep(steps[3]);
            }
            await this.applyStep(step);
        }

        this.output();
        this.success('success !!!');
    }

    async execute() {
        const pkd = loadPkd(this.env);
        const cluster = pkd.header.env.values.cluster;
        const kubeConfig = join(homedir(), '.kube', cluster);
        this.kubeOption = {
            cluster: cluster,
            isDryRun: this.options.dryRun,
            kubeConfig: kubeConfig,
        };
        this.packageName = pkd.header.name;
        this.kube = new PkKubeCtl(this.kubeOption, this);
        await this.apply(pkd);
    }
}


export default {
    command: 'apply',
    desc: 'apply deployments to kubernetes',
    builder: (yargs: any) => yargs
        .option('app', { describe: 'app name, (default = *)', default: '*' })
        .option('env', { describe: 'environment name (default = *)', default: '*' })
        .option('all', { describe: 'deploy all apps and environments', boolean: true })
        .option('dry-run', { describe: 'dry run', boolean: true })
        .option('immediate', { describe: 'execute immediately without initial 5 seconds delay', boolean: true })
        .option('yes', { describe: 'overwrite without confirmation', boolean: true }),
    handler: async (argv: any) => {
        await argv.$pk.tryCatch(async () => {

            if (argv.app === '*' && argv.env === '*' && !argv.all) {
                throw new Error('please specify --app app-name or --env env-name or --all');
            }

            await visitEachAppAndEnv(argv.app, argv.env, async (root, conf, app, envName) => {
                await new Command(argv, app.name, envName).execute();
            })
        });
    }
};