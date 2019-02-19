import * as pkyaml from '../../pk-yaml';
import { IOutput } from "./output";
import { IOptions } from "../../pk-lib/types";
import { IObject } from "../../common";

export class PktPackageOutput implements IOutput {
    constructor(private options: IOptions) { }

    package(objects: IObject[]): any {
        const newList = objects.map(o => o);

        newList.push({
            "apiVersion": "v1",
            kind: "Namespace",
            metadata: {
                name: "pk-packages",
            },
        });

        const objectList = objects
            .map(o => {
                const kind = o.kind;
                const avs = o.apiVersion.split('/');
                const apiGroup = avs.length == 2 ? avs[0] : '';
                const namespace = o.metadata.namespace || '';
                const name = o.metadata.name;

                return `${kind}/${apiGroup}/${name}/${namespace}`;
            })
            .join('\n');

        newList.push({
            apiVersion: "v1",
            kind: "ConfigMap",
            metadata: {
                name: this.options.pkt_package,
                namespace: "pk-packages",
                annotations: {
                    "pkt.io/pkz-id": this.options.pkt_package,
                },
            },
            data: {
                objects: objectList
            },
        });
        return newList;
    }

    * write(objects: IObject[]): Iterator<string> {
        objects = this.package(objects);

        yield `# PKT=${JSON.stringify({ args: this.options.argv, cwd: this.options.cwd })}`
        yield `# KUBE_CONFIG=${this.options.kubeconfig || ""}`
        yield `# KUBE_CONTEXT=${this.options.kubecontext || ""}`
        yield `# KUBE_CLUSTER=${this.options.kubecluster || ""}`
        yield `# KUBE_NAMESPACE=${this.options.kubenamespace || ""}`

        yield pkyaml.dumpYamlAll(objects);
        yield '';
    }
}
