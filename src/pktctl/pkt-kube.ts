import jsyaml from "js-yaml";
import { execSync } from "child_process";
import { ApplyConfig } from "./types";
import { execPipeSync } from "../kubectl/exec";
import { IResourceType, IResourceKey, IProgress, IKubeCtlConfig, IObject, ISet } from "../common";
import { getChalk } from "../pktlib/lazy";
import { KubeCtl } from "../kubectl/kubectl";

export class PkzKube extends KubeCtl {

    private unnamespacables: ISet | undefined;
    constructor(
        config: IKubeCtlConfig,
        ui: IProgress) {
        super(config, ui);
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
        // this.ui.log(`--- ${command}`);
        const result = execPipeSync(command, '(NotFound)');
        if (result) {
            const configmap = JSON.parse(result);
            // this.ui.log(configmap.data.objects);
            // this.ui.log('---');
            return configmap;
        }
        // this.ui.log('notfound');
        // this.ui.log('---');

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
                this.ui.error(`!!! cannot determine object to delete (kind=${key.kind}, name=${key.name}), namespace is missing`);
                continue;
            }

            this.ui.confirm(`delete ${key.kind} ${namespaced ? key.namespace + '/' : ''}${key.name}`);

            if (namespaced) {
                this.deleteRaw(key.kind, key.name, key.namespace);
            } else {
                this.deleteRaw(key.kind, key.name);
            }
        }
    }
}
