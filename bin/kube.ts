import { IObject } from "../lib/types";

export class Kube {
    kubeCommand: string;

    constructor(private kubeconfig: string | null, private namespace: string | null) {
        const kubeconfigOpt = kubeconfig ? `--kubeconfig=${kubeconfig} ` : '';
        const namespaceOpt = namespace ? `--namespace=${namespace} ` : '';
    
        this.kubeCommand = `kubectl apply ${kubeconfigOpt}${namespaceOpt}-f --dry-run=true -`;
    }

    private groupObjects(objects: IObject[]): IObject[][] {
        const g: IObject[][] = [ [], [], [] ]

        for (const o of objects) {
            switch (o.kind) {
                case 'Namespace':
                    g[0].push(o);
                    break;

                case 'Pod':
                case 'Deployment':
                case 'DaemonSet':
                case 'StatefulSet':
                    g[2].push(o);
                    break;

                default:
                    g[1].push(o);
            }
        }

        return g;
    }

    apply(objects: IObject[]) {
        const objGroups = this.groupObjects(objects);
        objGroups.forEach((objs, no) => {
            if (!objs || objs.length == 0)
                return;
            
            for (const o of objs) {
                console.log(`${o.kind}/${o.metadata.name} `)
            }
            console.log(`==> kubectl apply -f -`);
        });
    }
}
