import * as pkyaml from '../../pk-yaml';
import { IOutput } from "./output";
import { IOptions } from "../../pk-lib/types";
import { IObject } from "../../common";

export class YamlOutput implements IOutput {
    constructor(private options: IOptions) { }

    *write(objects: IObject[]): Iterator<string> {
        yield pkyaml.dumpYamlAll(objects)
    }
}
