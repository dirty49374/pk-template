"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const child_process_1 = require("child_process");
if (process.argv.length <= 2) {
    console.log(`usage: pk-apply __yamlfile__`);
    process.exit(0);
}
const filePath = process.argv[2];
const content = fs_1.default.readFileSync(filePath, 'utf8');
//const content = jsyaml.loadAll()
const config = {
    kubeconfig: null,
    context: null,
    cluster: null,
    namespace: null,
};
const configMap = {
    '# KUBE_CONFIG=': (v) => config.kubeconfig = v,
    '# KUBE_CONTEXT=': (v) => config.context = v,
    '# KUBE_CLUSTER=': (v) => config.cluster = v,
    '# KUBE_NAMESPACE=': (v) => config.namespace = v,
};
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
let option = '';
for (const k in config) {
    const v = config[k];
    if (v) {
        option += ` --${k} ${v}`;
    }
}
console.log(config);
console.log(option);
function buildSteps(objects) {
    const g = [
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
const objects = js_yaml_1.default.loadAll(content).filter(o => o != null);
const steps = buildSteps(objects);
for (const step of steps) {
    console.log(`* apply ${step.name}`);
    for (const o of step.objects) {
        console.log(`  ${o.kind} : ${o.metadata.name}`);
        console.log(`kubectl apply ${option} --dry-run `);
        child_process_1.exec(`kubectl apply ${option} --dry-run `, (err, stdout, stderr) => {
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
