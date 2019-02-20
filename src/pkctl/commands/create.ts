import { execute } from "../../pkt/pkt";
import { IObject } from "../../common";
import { IPktCreateOptions } from "../types";
import { Pkz } from '../../pk-lib/pkz';
import { getChalk, getReadlineSync } from '../../pk-lib/lazy';
import * as pkyaml from '../../pk-yaml';

export class CreateCommand {
    private args: string[];
    private packageName: string;

    constructor(private options: IPktCreateOptions) {
        this.args = options._.slice(1);
        this.packageName = this.options.packageName.endsWith('.pkz')
            ? this.options.packageName
            : this.options.packageName + '.pkz';
    }

    private objectError(object: IObject, err: string) {
        console.log(pkyaml.dumpYaml(object));
        console.error(getChalk().red('ERROR: ' + err));
        process.exit(1);

    }
    private package(objects: IObject[]): Pkz {
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
                name: this.options.packageName,
                namespace: "pk-packages",
                annotations: {
                    "pkt.io/pkz-id": this.options.packageName,
                },
            },
            data: {
                objects: objectList
            },
        });

        const pkz = new Pkz();
        pkz.name = this.packageName;
        pkz.args = this.args;
        pkz.kubeconfig = this.options.kubeconfig || '';
        pkz.context = this.options.context || '';
        pkz.cluster = this.options.cluster || '';
        pkz.objects = newList;

        return pkz;
    }

    async build(): Promise<Pkz | null> {
        const result = await execute(this.args, false);
        return result != null
            ? this.package(result.objects)
            : null;
    }

    async execute(): Promise<any> {
        const pkz = await this.build();
        if (pkz != null) {
            if (pkz.exists() && !this.options.yes) {
                getReadlineSync().question(getChalk().red(`file already exists, are you sure to overwrite ? [ENTER/CTRL-C] `));
            }
            pkz.save();
            console.log(getChalk().green(`${this.packageName} created`));
        } else {
            console.error(getChalk().red(`failed to create package ${this.packageName}`));
        }
    }
}
