#!/usr/bin/env node

import fs from 'fs';
import jsyaml from 'js-yaml';
import { IObject } from '../lib';
import { execSync } from 'child_process';
import readlineSync from 'readline-sync';
import chalk from 'chalk';
interface ApplyConfig {
    kubeconfig: string;
    context: string;
    cluster: string;
    apply: string;
    unnamespaced: IResourceType[];
    kube_dryrun_option: string;
    kube_option: string;
    kube_namespace_option: string;
    already_confirmed: boolean;
    sequential_apply: boolean;
    // [ key: string ]: string;
}

function header(message: string) {
    console.log();
    console.log('#  ', message);
    console.log();
}

function parseConfigurationComment(config: ApplyConfig, content: string) {
    
    const configMap: any = {
        '# KUBE_CONFIG=': (v: string) => config.kubeconfig = v,
        '# KUBE_CONTEXT=': (v: string) => config.context = v,
        '# KUBE_CLUSTER=': (v: string) => config.cluster = v,
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
    return config;    
}

interface ApplyStep {
    name: string;
    objects: IObject[];
}

function buildSteps(objects: IObject[], config: ApplyConfig): ApplyStep[] {
    const g: ApplyStep[] = [
        { name: 'Namespaces', objects: [] },
        { name: 'Resources', objects: [] },
        { name: 'Deployments', objects: [] },
        { name: 'PktPackage', objects: [] },
    ];


    for (const o of objects) {
        if (!o.metadata.namespace) {
            const namespaced = isNamespaced(config, o.kind);
            if (namespaced) {
                console.log(chalk.red(`namespace is missing on (kind=${o.kind}, name=${o.metadata.name})`));
                process.exit(1);
            }
        }

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
                if (o.kind == 'ConfigMap') {
                    const name = o.metadata.name;
                    const pkgid = o.metadata.annotations && o.metadata.annotations['pkt.io/package-id'];
                    if (name === `pkt-package-id-${pkgid}`) {
                        g[3].objects.push(o);    
                    } else {
                        g[1].objects.push(o);
                    }
                } else {
                    g[1].objects.push(o);
                }
        }
    }

    return g;
}

const confirm = (msg: string) => {
    readlineSync.question(`==> ARE YOU SURE TO APPLY '${msg}'? [ ENTER or CTRL-C ] : `);
}

const kubectlApply = (objects: IObject[], alloption: string) => {
    const yaml = objects.map(o => jsyaml.dump(o)).filter(o => o != null).join('---\n');
    const command = `kubectl apply${alloption} -f -`;
    
    console.log('---', command, '<<', `(${objects.length} objects)`);
    try {
        const opt: any = { input: yaml, stdio: [ 'pipe', process.stdout, process.stderr ] };
        execSync(command, opt);
    } catch (e) {
        console.log(yaml);
        process.exit(1);
    }
    console.log('---');
}

interface IResourceType {
    apiGroup: string;
    kind: string;
}

const execCommandSync = (command: string, notFoundPattern?: string): string => {
    try {
        const opt: any = { stdio: [ 'pipe', 'pipe', 'pipe' ]};
        const result = execSync(command, opt);
        const text = result.toString();
        return text;
    } catch (e) {
        if (notFoundPattern && e.message.includes(notFoundPattern)) {
            return '';
        }
        console.log(e.message);
        process.exit(1);
        throw new Error('impossible');
    }
}

const queryUnnamespaceResources = (config: ApplyConfig) => {
    const command = `kubectl api-resources --no-headers --namespaced=false ${config.kube_option}`;

    console.log('---', command);
    const result = execCommandSync(command);
    const lines = result.split('\n').filter(l => l);
    const resourceTypes: IResourceType[] = [];
    for (const line of lines) {
        const sp = line.trim().split(/\s+/);
        const res = sp.length == 4
            ? { kind: sp[3], apiGroup: ''}
            : { kind: sp[4], apiGroup: sp[2]};
        resourceTypes.push(res);
        console.log(`${res.kind}`);
    }
    console.log('---')

    config.unnamespaced = resourceTypes;
}

// const kubectlQuerySpec = (name: string, config: any): string => {
//     const command = `kubectl get configmap ${name} ${config.kube_option} --namespace default`;
//     console.log(command);
//     try {
//         const opt: any = { stdio: [ 'pipe', 'pipe', 'pipe' ]};
//         const result = execSync(command, opt);

//         return result.toString();
//     } catch (e) {
//         if (e.message.includes("No resources found.")) {
//             return '';
//         }
//         process.exit(1);
//         throw new Error('impossible');
//     }
// }

const queryPrevSpec = (name: string, config: any): any => {
    const command = `kubectl get configmap ${name} ${config.kube_option} --namespace default -ojson`;
    console.log('---', command);
    const result = execCommandSync(command, '(NotFound)');
    if (result) {
        const configmap = JSON.parse(result);
        console.log(configmap.data.objects);
        console.log('---');
        return configmap;
    }

    console.log('notfound');
    console.log('---');

    return { data: { objects: '' } };
}

interface IResourceKey {
    kind: string;
    apiGroup: string;
    namespace: string;
    name: string;
}

const findToBeDeleted = (currSpec: IObject, config: any): IResourceKey[] => {
    const prevSpec = queryPrevSpec(currSpec.metadata.name, config);
    const prevList = prevSpec.data.objects.split('\n')
        .filter((l: string) => l)
        .reduce((sum:any, k: string) => { sum[k] = true; return sum; }, {});
    const currList = currSpec.data.objects.split('\n')
        .filter((l: string) => l)
        .reduce((sum:any, k: string) => { sum[k] = true; return sum; }, {});

    const deleteList: IResourceKey[] = [];
    for (const key in prevList) {
        if (!currList[key]) {
            const [ kind, apiGroup, name, namespace ] = key.split('/');
            deleteList.push({ kind, apiGroup, namespace, name });
        }
    }
    return deleteList;
}

const isNamespaced = (config: ApplyConfig, kind: string) => {
    return config.unnamespaced.find(p => p.kind == kind) == null;
}

const kubectlDelete = (list: IResourceKey[], config: ApplyConfig) => {

    for (const key of list) {
        const namespaced = isNamespaced(config, key.kind);
        if (namespaced && !key.namespace) {
            console.log(chalk.red(`!!! cannot determine object to delete (kind=${key.kind}, name=${key.name}), namespace is missing`));
        } else {
            if (!config.already_confirmed) {
                confirm(`delete ${key.kind} ${namespaced ? key.namespace+'/' : ''}${key.name}`);
            }

            const command = namespaced
                ? `kubectl delete ${key.kind} ${key.name} --namespace ${key.namespace} ${key.name}`
                : `kubectl delete ${key.kind} ${key.name}`;

            console.log('---', command);
            if (config.apply) {
                const result = execCommandSync(command);
                console.log(result);
            } else {
                console.log('skipped');
            }
            console.log('---');
        }
    }
}

const apply = (content: string, config: ApplyConfig) => {
    const allOption = `${config.kube_dryrun_option}${config.kube_namespace_option}${config.kube_option}`;
    header('kubectl options: these options will be used');
    console.log(`    ${allOption}`);

    header(`querying un-namespaced resourced`);
    queryUnnamespaceResources(config);

    const objects = jsyaml.loadAll(content).filter(o => o != null);

    header(`building apply steps for ${objects.length} objects`)
    const steps = buildSteps(objects, config);
    console.log('---')
    console.log('success')
    console.log('---')

    for (const step of steps) {
        header(`applying ${step.name} step`);

        if (step.objects.length == 0) {
            continue;
        }

        if (step.name === 'PktPackage') {
            const deleteList = findToBeDeleted(step.objects[0], config);
            kubectlDelete(deleteList, config);
            console.log();
        }

        if (!config.already_confirmed) {
            confirm(`${step.objects.length} objects`);
        }

        if (config.sequential_apply) {
            for (const o of step.objects) {
                kubectlApply([ o ], allOption);
            }
        } else {
            kubectlApply(step.objects, allOption);
        }
    }
}

const parseArgs = (argv: string[]) => {
    const yargv = require('yargs/yargs')(argv)
        .boolean([ 'apply', 'single', 'yes' ])
        .argv

    return {
        target: yargv._[0],
        apply: yargv.apply,
        yes: yargv.yes,
        single: !!yargv.single,
    }
}

const buildApplyOption = (config: ApplyConfig, args: any) => {
    let option = ''
    if (config.kubeconfig)
        option += ` --kubeconfig ${config.kubeconfig}`;
    if (config.context)
        option += ` --context ${config.context}`;
    if (config.cluster)
        option += ` --cluster ${config.cluster}`;

    // for (const k in config) {
    //     if (k !== 'namespace') {
    //         const v = (config as any)[k];
    //         if (v) {
    //             option += ` --${k} ${v}`;
    //         }
    //     }
    // }

    config.kube_option = option;
    if (config.namespace) {
        config.kube_namespace_option = ` --namespace ${config.namespace}`;
    } else {
        config.kube_namespace_option = '';
    }

    if (args.apply) {
        config.apply = args.apply.toString();
    }

    config.already_confirmed = !!args.yes;
    if (!config.apply) {
        config.kube_dryrun_option = ' --dry-run';
        config.already_confirmed = true;
    }

    config.sequential_apply = !!args.single;

    return option;
}

const run = async (argv: string[]) => {
    const args = parseArgs(argv);
    if (!args.target) {
        console.log('useage: pkt-apply yaml_path [ --apply | --yes | --single ]')
        return;
    }

    const content = fs.readFileSync(args.target, 'utf8');
    const config: ApplyConfig = {
        kubeconfig: '',
        context: '',
        cluster: '',
        apply: '',
        kube_option: '',
        kube_namespace_option: '',
        kube_dryrun_option: '',
        sequential_apply: false,
        unnamespaced: [],
        already_confirmed: false,
    };

    parseConfigurationComment(config, content);
    buildApplyOption(config, args);    
 
    apply(content, config);
}

run(process.argv.slice(2));
