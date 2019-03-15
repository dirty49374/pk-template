import { IProgress, IKubeCtlConfig, IObject } from "../common";
import { execPipeSync, execStdin } from "./exec";
import * as pkyaml from '../pk-yaml';

export class KubeCtl {
    constructor(
        protected config: IKubeCtlConfig,
        protected progress: IProgress) {
    }

    async applyRaw(opt: IKubeCtlConfig, objects: IObject[]) {
        const yaml = objects.map(o => pkyaml.dumpYaml(o)).filter(o => o != null).join('---\n');
        const command = `kubectl apply --kubeconfig ${opt.kubeConfig}${opt.isDryRun ? ' --dry-run' : ''} -f -`;

        process.stdout.write('    ');
        await execStdin(command, yaml, data => {
            const indented = data.replace(/\n/g, '\n    ');
            process.stdout.write(indented);
        });
    }

    deleteRaw(opt: IKubeCtlConfig, kind: string, name: string, namespace?: string) {
        const command = namespace === undefined
            ? `kubectl delete ${kind} ${name} --kubeconfig ${opt.kubeConfig}`
            : `kubectl delete ${kind} ${name} --kubeconfig ${opt.kubeConfig} --namespace ${namespace}`;

        if (this.config.isDryRun) {
            this.progress.verbose('    skipped');
        } else {
            const result = execPipeSync(command, '(NotFound)');
            this.progress.verbose(`    ${result}`);
        }
    }
}
