import fs from 'fs';
import jsyaml from 'js-yaml';
import { IObject } from '../lib';
import { exec } from 'child_process';

if (process.argv.length <= 2) {
    console.log(`usage: pk-apply __yamlfile__`);
    process.exit(0);
}

const filePath = process.argv[2];
const content = fs.readFileSync(filePath, 'utf8');
//const content = jsyaml.loadAll()

const config: any = {
    kubeconfig: null,
    context: null,
    cluster: null,
    namespace: null,
}

const configMap: any = {
    '# KUBE_CONFIG=': (v: string) => config.kubeconfig = v,
    '# KUBE_CONTEXT=': (v: string) => config.context = v,
    '# KUBE_CLUSTER=': (v: string) => config.cluster = v,
    '# KUBE_NAMESPACE=': (v: string) => config.namespace = v,
}

const lines = content.split('\n');
for (const line of lines) {
    if (line.startsWith('#')) {
        for (const k in configMap) {
            if (line.startsWith(k)) {
                const setter = configMap[k];
                setter(line.substr(k.length).trim());
            }
        }
    }
}

let option = ''
for (const k in config) {
    const v = config[k];
    if (v) {
        option += ` --${k} ${v}`;
    }
}
console.log(config);
console.log(option);

interface ApplyStep {
    name: string;
    objects: IObject[];
}

function buildSteps(objects: IObject[]): ApplyStep[] {
    const g: ApplyStep[] = [
        { name: 'Namespaces', objects: [] },
        { name: 'Resources', objects: [] },
        { name: 'Deployments', objects: [] },
    ];

    for (const o of objects) {
        switch (o.kind) {
            case 'Namespace':
                g[0].objects.push(o);
                break;

            case 'Pod':
            case 'Deployment':
            case 'DaemonSet':
            case 'StatefulSet':
                g[2].objects.push(o);
                break;

            default:
                g[1].objects.push(o);
        }
    }

    return g;
}

const objects = jsyaml.loadAll(content).filter(o => o != null);
const steps = buildSteps(objects);

for (const step of steps) {
    console.log(`* apply ${step.name}`);
    for (const o of step.objects) {
        console.log(`  ${o.kind} : ${o.metadata.name}`);
        console.log(`kubectl apply ${option} --dry-run `)
        exec(`kubectl apply ${option} --dry-run `, (err, stdout, stderr) => {
            if (err) {
              // node couldn't execute the command
              return;
            }
          
            // the *entire* stdout and stderr (buffered)
            console.log(`stdout: ${stdout}`);
            console.log(`stderr: ${stderr}`);
        });
    }
    console.log();
}
