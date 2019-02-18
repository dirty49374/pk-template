import { IProgress, IKubeCtlConfig, IObject } from "../common";
import { execPipeSync, execStdin } from "./exec";
import * as pkyaml from '../pk-yaml';

export class KubeCtl {
    constructor(
        protected config: IKubeCtlConfig,
        protected progress: IProgress) {
    }

    async applyRaw(objects: IObject[], alloption: string) {
        const yaml = objects.map(o => pkyaml.dumpYaml(o)).filter(o => o != null).join('---\n');
        const command = `kubectl apply${alloption} -f -`;

        process.stdout.write('    ');
        await execStdin(command, yaml, data => {
            const indented = data.replace(/\n/g, '\n    ');
            process.stdout.write(indented);
        });
    }

    deleteRaw(kind: string, name: string, namespace?: string) {
        const command = namespace === undefined
            ? `kubectl delete ${kind} ${name}`
            : `kubectl delete ${kind} ${name} --namespace ${namespace}`;

        if (this.config.kube_dryrun_option) {
            this.progress.verbose('    skipped');
        } else {
            const result = execPipeSync(command, '(NotFound)');
            this.progress.verbose(`    ${result}`);
        }
    }
}
