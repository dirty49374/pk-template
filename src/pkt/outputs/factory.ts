import { IPktOptions } from '../../pk-template/types';
import { JsonOutput } from './json-output';
import { PktOutput } from './pkt-output';
import { YamlOutput } from './yaml-output';
import { IOutput } from './output';
import { IObject } from '../../common';

export function outputFactory(options: IPktOptions): IOutput {
    if (options.json || options.json1) {
        return new JsonOutput(options);
    } else if (options.pkt) {
        return new PktOutput(options);
    } else {
        return new YamlOutput(options);
    }
}

export function buildOutput(options: IPktOptions, objects: IObject[]): string {
    const generator = outputFactory(options).write(objects);
    const list = [];
    while (true) {
        const result = generator.next();
        if (result.done) {
            return list.join('\n');
        } else {
            list.push(result.value);
        }
    }
}
