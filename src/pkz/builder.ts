import { IObject } from "../common";
import * as pkyaml from '../pk-yaml';
import { getChalk, getReadlineSync } from '../pk-template/lazy';
import { IPktArgs } from "../pkt/args";
import { IPkz } from "../pk-template/types";

export class PkzBuilder {
    private objectError(object: IObject, err: string) {
        console.log(pkyaml.dumpYaml(object));
        console.error(getChalk().red('ERROR: ' + err));
        process.exit(1);

    }

    build(packageName: string, contextName: string, args: IPktArgs, objects: IObject[]): IPkz {
        const newList = objects.map(o => o);

        newList.push({
            "apiVersion": "v1",
            kind: "Namespace",
            metadata: {
                name: "pk-packages",
            },
        });

        for (const o of newList) {
            if (!o.metadata) {
                this.objectError(o, 'object does not have metadata');
            }
            if (!o.kind) {
                this.objectError(o, 'object does not have kind');
            }
            if (!o.apiVersion) {
                this.objectError(o, 'object does not have apiVersion');
            }
            if (!o.metadata.name) {
                this.objectError(o, 'object does not have name');
            }
        }

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
                name: packageName,
                namespace: "pk-packages",
                annotations: {
                    "pkt.io/pkz-id": packageName,
                },
            },
            data: {
                objects: objectList
            },
        });

        const pkz: IPkz = {
            name: packageName,
            args: args,
            context: contextName || '',
            objects: newList,
        };

        return pkz;
    }
}
