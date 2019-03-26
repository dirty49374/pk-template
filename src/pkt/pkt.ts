import fs from 'fs';
import help from './help';
import * as pkyaml from '../pk-yaml';
import { buildOutput } from './outputs/factory';
import { ArgsBuilder, IPktArgs } from './args';
import { IValues } from '../pk-template';
import { IObject, version } from '../common';
import { readStdin } from '../pk-template/utils';
import { Scope } from '../pk-template/scope';
import { exceptionHandler } from '../pk-util/exception';
import { IResult } from '../pk-template/types';
import { LanguageVm } from '../pk-template/virtualMachine';
import { languageSpec } from '../pk-template/languageSpec';

function _generate(objects: IObject[], values: IValues, file: string): IObject[] {
    objects = objects || [];
    const scope = Scope.CreateRoot(objects, values);
    LanguageVm.Run(languageSpec, scope, file);

    return scope.objects;
}

export function generate(args: IPktArgs): IObject[] {
    return _generate([], args.values, args.file);
}

export async function generateWithStdin(args: IPktArgs): Promise<IObject[]> {
    const text = await readStdin();
    const inputObjects = pkyaml.parseYamlAll(text);
    const objects = _generate(inputObjects, args.values, args.file);
    return objects;
}

export async function execCommand(argv: any, print: boolean): Promise<IResult | null> {

    let args = new ArgsBuilder().build(argv);

    if (args.options.version) {
        console.log(version());
        return null;
    }

    if (args.options.help) {
        help(args.file);
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
        await exceptionHandler(e, !!args.options.debug);

        throw e;
    }
}
