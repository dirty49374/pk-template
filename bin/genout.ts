import { IObject } from '../lib/types';
import { JsonOutput } from './outputs/json-output';
import { PktOutput } from './outputs/pkt-output';
import { YamlOutput } from './outputs/yaml-output';
import { BashOutput } from './outputs/bash-output';
import { IOutput } from './outputs/output';

export function outputFactory (options: any): IOutput {
    if (options.json || options.json1) {
        return new JsonOutput(options);
    } else if (options.pkt) {
        return new PktOutput(options);
    } else if (options.apply) {
        return new BashOutput(options);
    } else {
        return new YamlOutput(options);
    }
}
