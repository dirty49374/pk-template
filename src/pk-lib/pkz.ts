import fs from 'fs';
import * as pkyaml from '../pk-yaml';
import { IPkz } from "./types";
import { IObject } from "../common";
import { basename } from 'path';

export class Pkz implements IPkz {
    public name: string = '';
    public args: string[] = [];
    public kubeconfig: string = '';
    public context: string = '';
    public cluster: string = '';
    public objects: IObject[] = [];

    constructor() { }

    static Load(path: string): IPkz {
        const patterns = {
            '# KUBE_CONFIG=': (pkt: IPkz, v: string) => pkt.kubeconfig = v,
            '# CONTEXT=': (pkt: IPkz, v: string) => pkt.context = v,
            '# CLUSTER=': (pkt: IPkz, v: string) => pkt.cluster = v,
        } as any;

        const pkz = new Pkz();
        pkz.name = basename(path);

        const text = fs.readFileSync(path, 'utf8');
        if (!text.startsWith('# PKZ=')) {
            console.log(`${path} is not a valid pkt generated yaml.`);
            process.exit(1);
        }
        const lineEnd = text.indexOf('\n');
        pkz.args = JSON.parse(text.substring(6, lineEnd));

        const lines = text.split('\n');
        for (const line of lines) {
            if (!line.startsWith('#'))
                break;

            for (const pattern in patterns) {
                if (line.startsWith(pattern)) {
                    const value = line.substr(pattern.length).trim();
                    const setter = patterns[pattern];
                    setter(pkz, value);
                }
            }
        }
        pkz.objects = pkyaml.parseYamlAll(text);

        return pkz;
    }

    save() {
        const yaml = this.toYaml();
        fs.writeFileSync(this.name, yaml, 'utf8');
    }

    exists(): boolean {
        return fs.existsSync(this.name);
    }

    toYaml() {
        const lines: string[] = [];

        lines.push(`# PKZ=${JSON.stringify(this.args)}`)
        lines.push(`# KUBE_CONFIG=${this.kubeconfig || ""}`);
        lines.push(`# CONTEXT=${this.context || ""}`);
        lines.push(`# CLUSTER=${this.cluster || ""}`);

        lines.push(`#`);
        lines.push(`# APPLY:`);
        lines.push(`# - pkctl   : $ pkctl apply ${this.name}`);

        const options = []
        if (this.kubeconfig) {
            options.push(`--kubeconfig ${this.kubeconfig}`);
        }
        if (this.context) {
            options.push(`--context ${this.context}`);
        }
        if (this.cluster) {
            options.push(`--cluster ${this.cluster}`);
        }
        lines.push(`# - kubectl : $ kubectl apply ${options.join(' ')} -f ./${this.name}`);

        lines.push(pkyaml.dumpYamlAll(this.objects));

        return lines.join('\n');
    }
}
