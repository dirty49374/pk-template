import { IOptions } from '../pktlib/types';
import { JsonOutput } from './outputs/json-output';
import { PktOutput } from './outputs/pkt-output';
import { YamlOutput } from './outputs/yaml-output';
import { BashOutput } from './outputs/bash-output';
import { IOutput } from './outputs/output';
import { PktPackageOutput } from './outputs/pkt-package-output';
import { IObject } from '../common';

export function outputFactory(options: IOptions): IOutput {
    if (options.json || options.json1) {
        return new JsonOutput(options);
    } else if (options.pkt) {
        return new PktOutput(options);
    } else if (options.bash) {
        return new BashOutput(options);
    } else if (options.pkt_package) {
        return new PktPackageOutput(options);
    } else {
        return new YamlOutput(options);
    }
}

export function buildOutput(options: IOptions, objects: IObject[]): string {
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
