import fs from 'fs';
import help from './help';
import * as pkyaml from '../pk-yaml';
import { buildOutput } from './outputs/factory';
import { ArgsBuilder, IPktArgs } from './args';
import { Runtime, IValues } from '../pk-template';
import { IObject, version } from '../common';
import { readStdin } from '../pk-template/utils';
import { Scope } from '../pk-template/scope';
import { exceptionHandler } from '../pk-util/exception';
import { IResult } from '../pk-template/types';
import { PkConf } from '../pk-conf/conf';
import { IPkEnv } from '../pk-conf';

function gen(objects: IObject[], values: IValues, files: string[], env: IPkEnv | null): IObject[] {
    objects = objects || [];
    const scope = Scope.CreateRoot(objects, values, env);
    for (const path of files) {
        Runtime.Run(scope, path);
    }

    return scope.objects;
}

export async function generate(args: IPktArgs): Promise<IResult> {
    const { conf } = args.files.length > 0
        ? PkConf.find(args.files[0])
        : PkConf.find('.');
    const envs = (conf && conf.envs) || [];
    const env = args.options.env ? (envs.find(e => e.name === args.options.env) || null) : null;

    if (args.options.stdin) {
        const text = await readStdin();
        const inputObjects = pkyaml.parseYamlAll(text);
        const objects = gen(inputObjects, args.values, args.files, env);
        return { objects, args, env };
    } else {
        const objects = gen([], args.values, args.files, env);
        return { objects, args, env };
    }
}

export async function executeWithTryCatch(args: IPktArgs, print: boolean): Promise<IResult | null> {

    const result = await generate(args);
    if (print) {
        const output = buildOutput(args.options, result.objects);
        console.log(output);
    }
    return result;
}

export async function execCommand(argv: any, print: boolean): Promise<IResult | null> {

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
