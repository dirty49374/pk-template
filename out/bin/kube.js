"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Kube {
    constructor(kubeconfig, namespace) {
        this.kubeconfig = kubeconfig;
        this.namespace = namespace;
        const kubeconfigOpt = kubeconfig ? `--kubeconfig=${kubeconfig} ` : '';
        const namespaceOpt = namespace ? `--namespace=${namespace} ` : '';
        this.kubeCommand = `kubectl apply ${kubeconfigOpt}${namespaceOpt}-f --dry-run=true -`;
    }
    groupObjects(objects) {
        const g = [[], [], []];
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
    apply(objects) {
        const objGroups = this.groupObjects(objects);
        objGroups.forEach((objs, no) => {
            if (!objs || objs.length == 0)
                return;
            for (const o of objs) {
                console.log(`${o.kind}/${o.metadata.name} `);
            }
            console.log(`==> kubectl apply -f -`);
        });
    }
}
exports.Kube = Kube;
