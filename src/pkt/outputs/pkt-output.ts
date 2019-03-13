import { IPktOptions } from "../../pk-template/types";
import * as pkyaml from '../../pk-yaml';
import { IOutput } from "./output";
import { IObject } from "../../common";

export class PktOutput implements IOutput {
    constructor(private options: IPktOptions) { }

    *write(objects: IObject[]): Iterator<string> {
        var pkt = {
            routine: objects.map(o => ({ add: o }))
        }
        const yaml = pkyaml.dumpYaml(pkt);
        yield yaml;
    }
}
