import fs from 'fs';
import help from './help';
import * as pkyaml from '../pk-yaml';
import { buildOutput } from './outputs/factory';
import { ArgsBuilder, IPktArgs } from './args';
import { Runtime, IValues } from '../pk-lib';
import { IObject, version } from '../common';
import { readStdin } from '../pk-lib/utils';
import { Scope } from '../pk-lib/scope';
import { exceptionHandler } from '../pk-util/exception';
import { PktModule } from '../pk-lib/module';
import { IPktEnv } from '../pk-lib/types';

export interface IResult {
    objects: IObject[];
    args: IPktArgs;
}

function run(objects: IObject[], values: IValues, files: string[], env: IPktEnv | null): IObject[] {
    objects = objects || [];
    const scope = Scope.CreateRoot(objects, values, env);
    for (const path of files) {
        Runtime.Run(scope, path);
    }

    return scope.objects;
}

async function generate(args: IPktArgs, env: IPktEnv | null): Promise<IObject[]> {
    if (args.options.stdin) {
        const text = await readStdin();
        const objects = pkyaml.parseYamlAll(text);
        return run(objects, args.values, args.files, env);
    } else {
        return run([], args.values, args.files, env);
    }
}

export async function executeWithTryCatch(args: IPktArgs, print: boolean): Promise<IResult | null> {

    const module = args.files.length > 0
        ? PktModule.Load(args.files[0])
        : PktModule.Load('.');
    const envs = (module && module.module && module.module.envs) || []
    const env = args.options.env ? (envs.find(e => e.name == args.options.env) || null) : null;
    const objects = await generate(args, env);

    if (print) {
        const output = buildOutput(args.options, objects);
        console.log(output);
    }
    return { objects, args };
}

export async function execute(argv: any, print: boolean): Promise<IResult | null> {

    if (argv.length == 0) {
        help([]);
        return null;
    }

    let args = new ArgsBuilder().build(argv);

    if (args.options.version) {
        console.log(version());
        return null;
    }

    if (args.options.help) {
        help(args.files);
        return null;
    }

    if (args.options.spec) {
        const spec = pkyaml.dumpYaml({
            files: args.files,
            values: args.values,
        });
        const specFn = args.options.spec.toLowerCase().endsWith('.pks')
            ? args.options.spec
            : args.options.spec + '.pks'
        fs.writeFileSync(specFn, spec, 'utf8');
        console.log(`'${specFn}' saved.`);
        console.log();
        console.log(spec);
        return null;
    }

    try {
        return await executeWithTryCatch(args, print);
    } catch (e) {
        await exceptionHandler(e);

        throw e;
    }
}
