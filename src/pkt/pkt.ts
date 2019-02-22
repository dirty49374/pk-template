import fs from 'fs';
import help from './help';
import * as pkyaml from '../pk-yaml';
import process from 'process';
import { buildOutput } from './outputs/factory';
import { ArgsBuilder, IPktArgs } from './args';
import { Runtime, IValues } from '../pk-lib';
import { diffObjects } from '../pk-diff/diff-objects';
import { IObject, version } from '../common';
import { readStdin } from '../pk-lib/utils';
import { Scope } from '../pk-lib/scope';
import { exceptionHandler } from '../pk-util/exception';

export interface IResult {
    objects: IObject[];
    args: IPktArgs;
}

function run(objects: IObject[], values: IValues, files: string[]): IObject[] {
    objects = objects || [];
    const scope = Scope.CreateRoot(objects, values);
    for (const path of files) {
        Runtime.Run(scope, path);
    }

    return scope.objects;
}

async function generate(args: IPktArgs): Promise<IObject[]> {
    if (args.options.stdin) {
        const text = await readStdin();
        const objects = pkyaml.parseYamlAll(text);
        return run(objects, args.values, args.files);
    } else {
        return run([], args.values, args.files);
    }
}

export async function executeWithTryCatch(args: IPktArgs, print: boolean): Promise<IResult | null> {
    if (args.options.version) {
        console.log(version());
        return null;
    }

    if (args.options.help) {
        help(args);
        return null;
    }

    if (args.options.argv.length == 0) {
        help(args);
        return null;
    }

    const objects = await generate(args);
    if (print) {
        const output = buildOutput(args.options, objects);
        console.log(output);
    }
    return { objects, args };
}

export async function execute(argv: any, print: boolean): Promise<IResult | null> {
    let args = new ArgsBuilder().build(argv);

    try {
        return await executeWithTryCatch(args, print);
    } catch (e) {
        await exceptionHandler(e);

        throw e;
    }
}
