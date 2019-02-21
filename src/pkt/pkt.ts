import fs from 'fs';
import help from './help';
import * as pkyaml from '../pk-yaml';
import process from 'process';
import { buildOutput } from './outputs/factory';
import { ArgsBuilder, IPktArgs } from './args';
import { Runtime, IValues, IConfig } from '../pk-lib';
import { IOptions } from '../pk-lib';
import { diffObjects } from '../pk-diff/diff-objects';
import { IObject, version } from '../common';
import { readStdin } from '../pk-lib/utils';
import { Config } from '../pk-lib/configs';
import { Scope } from '../pk-lib/scope';
import { exceptionHandler } from './exception';

export interface IResult {
    objects: IObject[];
    args: IPktArgs;
}

function run(objects: IObject[], values: IValues, files: string[], config: IConfig, options: IOptions): IObject[] {
    objects = objects || [];
    const userdata = {};
    const scope = Scope.CreateRoot(objects, values, config, options, userdata);
    for (const path of files) {
        Runtime.Run(scope, path);
    }

    return scope.objects;
}

async function update(path: string, config: IConfig, args: IPktArgs) {
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

    const prev = pkyaml.parseYamlAll(original).filter((o: any) => o != null);
    const curr = result.objects.filter((o: any) => o != null);

    diffObjects(prev, curr);

    if (args.options.pkt_package_update_write) {
        const output = buildOutput(result.args.options, result.objects);
        console.log();
        console.log(`writing '${path}.pkz' ...`);
        fs.writeFileSync(`${path}.pkz`, output, 'utf8');
        console.log(`'${path}.pkz' updated`);
    } else {
        console.log();
        console.log(`skip writing '${path}.pkz'. (to update, add -W flag)`);
    }
}

async function generate(config: IConfig, args: IPktArgs): Promise<IObject[]> {
    if (args.options.stdin) {
        const text = await readStdin();
        const objects = pkyaml.parseYamlAll(text);
        return run(objects, args.values, args.files, config, args.options);
    } else {
        return run([], args.values, args.files, config, args.options);
    }
}

export async function executeWithTryCatch(argv: any, args: IPktArgs, config: IConfig, print: boolean): Promise<IResult | null> {
    if (args.options.version) {
        console.log(version());
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

export async function execute(argv: any, print: boolean): Promise<IResult | null> {
    const config = Config.Load();
    let args = new ArgsBuilder().build(argv, config);

    try {
        return await executeWithTryCatch(argv, args, config, print);
    } catch (e) {
        await exceptionHandler(e);

        throw e;
    }
}
