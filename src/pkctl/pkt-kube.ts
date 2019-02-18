import { execPipeSync } from "../pk-kubectl/exec";
import { IResourceKey, IProgress, IKubeCtlConfig, IObject, ISet } from "../common";
import { KubeCtl } from "../pk-kubectl/kubectl";

export class PkzKube extends KubeCtl {

    private unnamespacables: ISet | undefined;
    constructor(
        config: IKubeCtlConfig,
        progress: IProgress) {
        super(config, progress);
    }

    queryUnnamespacables() {
        const command = `kubectl api-resources --no-headers --namespaced=false ${this.config.kube_option}`;
        const result = execPipeSync(command);

        const lines = result.split('\n').filter(l => l);

        const set: ISet = {};
        for (const line of lines) {
            const sp = line.trim().split(/\s+/);
            const key = sp.length == 4
                ? `/${sp[3]}`
                : `${sp[2]}/${sp[4]}`;
            set[key] = true;
        }

        return set;
    }


    getPkzSpecOrDefault(name: string): IObject {
        const command = `kubectl get configmap ${name} ${this.config.kube_option} --namespace default -ojson`;
        // this.progress.log(`--- ${command}`);
        const result = execPipeSync(command, '(NotFound)');
        if (result) {
            const configmap = JSON.parse(result);
            // this.progress.log(configmap.data.objects);
            // this.progress.log('---');
            return configmap;
        }
        // this.progress.log('notfound');
        // this.progress.log('---');

        return { metadata: { name }, data: { objects: '' } };
    }

    toApiGroup(apiVersion: string): string {
        const sp = apiVersion.split('/');
        return sp.length == 2 ? sp[0] : '';
    }

    isNamespacedType(apiGroup: string, kind: string) {
        if (!this.unnamespacables) {
            this.unnamespacables = this.queryUnnamespacables();
        }
        return !this.unnamespacables[`${apiGroup}/${kind}`];
    }

    isNamespacedObject(object: IObject) {
        const apiGroup = this.toApiGroup(object.apiVersion);
        return this.isNamespacedType(apiGroup, object.kind)
    }

    deleteObjects(keys: IResourceKey[]) {
        for (const key of keys) {
            const namespaced = this.isNamespacedType(key.apiGroup, key.kind);
            if (namespaced && !key.namespace) {
                this.progress.error(`!!! cannot determine object to delete (kind=${key.kind}, name=${key.name}), namespace is missing`);
                continue;
            }

            this.progress.confirm(`delete ${key.kind} ${namespaced ? key.namespace + '/' : ''}${key.name}`);

            if (namespaced) {
                this.deleteRaw(key.kind, key.name, key.namespace);
            } else {
                this.deleteRaw(key.kind, key.name);
            }
        }
    }
}
