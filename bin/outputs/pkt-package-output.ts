import jsyaml from "js-yaml";
import { IOutput } from "./output";
import { IObject, IOptions } from "../../lib/types";

export class PktPackageOutput implements IOutput {
    constructor(private options: IOptions) { }

    checkIntegrity(objects: IObject[]): any {
    }

    *write(objects: IObject[]): Iterator<string> {
        this.checkIntegrity(objects);

        yield `# PKT=${JSON.stringify({ args: this.options.argv, cwd: this.options.cwd })}`
        yield `# KUBE_CONFIG=${this.options.kubeconfig || ""}`
        yield `# KUBE_CONTEXT=${this.options.kubecontext || ""}`
        yield `# KUBE_CLUSTER=${this.options.kubecluster || ""}`
        yield `# KUBE_NAMESPACE=${this.options.kubenamespace || ""}`

        for (const o of objects) {
            yield '---';
            if (o == null) {
                continue;
            }
            yield jsyaml.dump(o);
        }
        yield '';
    }
}