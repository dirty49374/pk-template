import fs from 'fs';
import help from './help';
import * as pkyaml from '../pk-yaml';
import process from 'process';
import version from './version';
import { buildOutput } from './build-output';
import { ArgsBuilder, IArgs } from './args';
import { runtimes, configs, IValues, IConfig } from '../pk-lib';
import { IOptions } from '../pk-lib';
import { readStdin } from '../pk-lib/readStdin';
import { diffObjects } from './diff-objects';
import { getChalk } from '../pk-lib/lazy';
import { IObject } from '../common';

interface Result {
    objects: IObject[];
    args: IArgs;
}

function run(objects: IObject[], values: IValues, files: string[], config: IConfig, options: IOptions): IObject[] {
    const chalk = getChalk();
    objects = objects || [];
    try {
        const userdata = {};
        return runtimes.exec(objects, values, files, config, userdata);
    } catch (e) {
        if (e.summary) {
            console.error(chalk.red('ERROR: ' + e.summary + ' in ' + e.uri));
            console.error(chalk.red('       ' + e.message));
        } else {
            console.error(chalk.red(e.message));
        }
        if (options.debug) {
            console.error(e);
        }
        process.exit(1);
        return [];
    }
}

async function update(path: string, config: IConfig, args: IArgs) {
    const original = fs.readFileSync(`${path}.pkz`, 'utf8');
    if (!original.startsWith('# PKT=')) {
        console.log(`${path} is not a valid pkt generated yaml.`);
        process.exit(1);
    }

    const lineEnd = original.indexOf('\n');
    const prevOpt = JSON.parse(original.substring(6, lineEnd));

    process.chdir(prevOpt.cwd);
    console.log(`previously command used:`);
    console.log(`  $ pkt ${prevOpt.args.map((p: string) => p.includes(' ') ? `"${p}"` : p).join(' ')}`);
    console.log();
    const result = await execute(prevOpt.args, false);

    if (!result) {
        console.log('unknown error');
        process.exit(1);
        return;
    }

    const prev = pkyaml.loadYamlAll(original).filter((o: any) => o != null);
    const curr = result.objects.filter((o: any) => o != null);

    diffObjects(prev, curr);

    if (args.options.pkt_package_update_write) {
        const output = buildOutput(result.args.options, result.objects);
        fs.writeFileSync(`${path}.pkz`, output, 'utf8');
        console.log(`pkt-package file '${path}.pkz' is updated !!!`);
    } else {
        console.log(`pkt-package file '${path}.pkz' is not updated, (to update, add -W flasg)`);
    }
}

async function generate(config: IConfig, args: IArgs): Promise<IObject[]> {
    if (args.options.stdin) {
        const text = await readStdin();
        const objects = pkyaml.loadYamlAll(text);
        return run(objects, args.values, args.files, config, args.options);
    } else {
        return run([], args.values, args.files, config, args.options);
    }
}

async function execute(argv: any, print: boolean): Promise<Result | null> {
    const config = configs.load();
    let args = new ArgsBuilder().build(argv, config);

    if (args.options.version) {
        version();
        return null;
    }

    if (args.options.help) {
        help(args);
        return null;
    }

    if (args.options.pkt_package_update) {
        if (!args.options.pkt_package) {
            throw new Error("unknown error: pkt-apply filename not set");
        }
        await update(args.options.pkt_package, config, args);
        return null;
    }

    if (args.options.argv.length == 0) {
        help(args);
        return null;
    }

    const objects = await generate(config, args);
    if (args.options.pkt_package) {
        const buildSpec = (objects: IObject[]): IObject => {
            const objectList = objects
                .map(o => {
                    const kind = o.kind;
                    const avs = o.apiVersion.split('/');
                    const apiGroup = avs.length == 2 ? avs[0] : '';
                    const namespace = o.metadata.namespace || args.options.kubenamespace || '';
                    const name = o.metadata.name;

                    return `${kind}/${apiGroup}/${name}/${namespace}`;
                })
                .join('\n');
            return {
                "apiVersion": "v1",
                "kind": "ConfigMap",
                "metadata": {
                    "name": `pkt-package-id-${args.options.pkt_package}`,
                    "namespace": "default",
                    "annotations": {
                        "pkt.io/package-id": args.options.pkt_package,
                    },
                },
                "data": {
                    "objects": objectList
                },
            }
        }
        objects.push(buildSpec(objects));
    }

    if (print) {
        const output = buildOutput(args.options, objects);
        if (args.options.pkt_package) {
            fs.writeFileSync(`${args.options.pkt_package}.pkz`, output);
            console.log(`pkt-package file '${args.options.pkt_package}.pkz' created`);
        } else {
            console.log(output);
        }
    }
    return { objects, args };
}

execute(process.argv.slice(2), true);
