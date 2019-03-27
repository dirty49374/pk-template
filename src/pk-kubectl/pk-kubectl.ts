import { execPipeSync } from "./exec";
import { IResourceKey, IProgress, IKubeCtlConfig, IObject, ISet } from "../common";
import { KubeCtl } from "./kubectl";

export class PkKubeCtl extends KubeCtl {

    private unnamespacables: ISet | undefined;
    constructor(
        config: IKubeCtlConfig,
        progress: IProgress) {
        super(config, progress);
    }

    queryUnnamespacables() {
        const command = `kubectl api-resources --no-headers --namespaced=false --kubeconfig ${this.config.kubeConfig}`;
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


    getPkzSpec(name: string): IObject | null {
        const command = `kubectl get configmap ${name} --kubeconfig ${this.config.kubeConfig} --namespace pk-deployments -ojson`;
        const result = execPipeSync(command, '(NotFound)');
        if (result) {
            const configmap = JSON.parse(result);
            return configmap;
        }

        return null;
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
            if (key.apiGroup == '' && key.kind == 'Namespace' && key.name == 'default') {
                this.progress.verbose('    skip default namespaces');
                continue;
            }
            const namespaced = this.isNamespacedType(key.apiGroup, key.kind);
            if (namespaced && !key.namespace) {
                this.progress.error(`!!! cannot determine object to delete (kind=${key.kind}, name=${key.name}), namespace is missing`);
                continue;
            }

            this.progress.confirm(`delete ${key.kind} ${namespaced ? key.namespace + '/' : ''}${key.name}`);

            if (namespaced) {
                this.deleteRaw(this.config, key.kind, key.name, key.namespace);
            } else {
                this.deleteRaw(this.config, key.kind, key.name);
            }
        }
    }
}
