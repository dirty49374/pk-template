#!/usr/bin/env node

import fs from 'fs';
import jsyaml from 'js-yaml';
import { IObject } from '../lib';
import { execSync } from 'child_process';
import readlineSync from 'readline-sync';

function parseConfigurationComment(content: string) {
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
    return config;    
}

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

const confirm = (msg: string) => {
    readlineSync.question(`==> ARE YOU SURE TO APPLY '${msg}'? [ ENTER or CTRL-C ] : `);
}

const kubectl = (objects: IObject[], args: any, alloption: string) => {
    const yaml = objects.map(o => jsyaml.dump(o)).filter(o => o != null).join('---\n');
    const command = `kubectl apply ${alloption} -f -`;
    try {
        const opt: any = { input: yaml, stdio: [ 'pipe', process.stdout, process.stderr ] };
        execSync(command, opt);
    } catch (e) {
        console.log(yaml);
        process.exit(1);
    }
}

const apply = (content: string, args: any, config: any) => {
    const objects = jsyaml.loadAll(content).filter(o => o != null);
    const steps = buildSteps(objects);
    
    const allOption = `${args.apply ? '' : ' --dry-run'}${config.kubeoption}`;
    console.log('# kubectl options: these options will be used');
    console.log('');
    console.log(`    ${allOption}`);

    for (const step of steps) {
        console.log();
        console.log(`#   applying ${step.name} step (${step.objects.length} objects)`);

        if (step.objects.length == 0) {
            continue;
        }

        if (!args.yes) {
            confirm(`${step.objects.length} objects`);
        }
        if (args.single) {
            for (const o of step.objects) {
                kubectl([ o ], args, allOption);
            }
        } else {
            kubectl(step.objects, args, allOption);
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

const buildApplyOption = (config: any) => {
    let option = ''
    for (const k in config) {
        const v = config[k];
        if (v) {
            option += ` --${k} ${v}`;
        }
    }
    return option;
}

const run = async (argv: string[]) => {
    const args = parseArgs(argv);
    if (!args.target) {
        console.log('useage: pkt-apply yaml_path [ --apply | --yes | --single ]')
        return;
    }

    const content = fs.readFileSync(args.target, 'utf8');
    const config = parseConfigurationComment(content);
    config.kubeoption = buildApplyOption(config);    
 
    apply(content, args, config);
}

run(process.argv.slice(2));
