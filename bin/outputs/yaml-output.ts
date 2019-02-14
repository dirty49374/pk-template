import jsyaml from "js-yaml";
import { IOutput } from "./output";
import { IObject, IOptions } from "../../lib/types";

export class YamlOutput implements IOutput {
    constructor(private options: IOptions) {}
    
    write(objects: IObject[]) {
        console.log(`# KUBE_CONFIG=${this.options.kubeconfig || ""}`);
        console.log(`# KUBE_CONTEXT=${this.options.kubecontext || ""}`);
        console.log(`# KUBE_CLUSTER=${this.options.kubecluster || ""}`);
        console.log(`# KUBE_NAMESPACE=${this.options.kubenamespace || ""}`);
        console.log(`---`);
        objects.forEach((o: IObject) => {
            console.log(jsyaml.dump(o));
            console.log('---');
        });
    }
}
