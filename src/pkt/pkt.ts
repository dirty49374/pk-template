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

function _generate(objects: IObject[], values: IValues, files: string[]): IObject[] {
    objects = objects || [];
    const scope = Scope.CreateRoot(objects, values);
    for (const path of files) {
        Runtime.Run(scope, path);
    }

    return scope.objects;
}

export function generate(args: IPktArgs): IObject[] {
    return _generate([], args.values, args.files);
}

export async function generateWithStdin(args: IPktArgs): Promise<IObject[]> {
    const text = await readStdin();
    const inputObjects = pkyaml.parseYamlAll(text);
    const objects = _generate(inputObjects, args.values, args.files);
    return objects;
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

    try {
        const objects = args.options.stdin
            ? await generateWithStdin(args)
            : generate(args);

        if (print) {
            const output = buildOutput(args.options, objects);
            console.log(output);
        }
        return { args, objects };
    } catch (e) {
        await exceptionHandler(e);

        throw e;
    }
}
