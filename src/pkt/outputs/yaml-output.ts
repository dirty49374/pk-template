import * as pkyaml from '../../pk-yaml';
import { IOutput } from "./output";
import { IPktOptions } from "../../pk-template/types";
import { IObject } from "../../common";

export class YamlOutput implements IOutput {
  constructor(private options: IPktOptions) { }

  *write(objects: IObject[]): Iterator<string> {
    yield pkyaml.dumpYamlAll(objects)
  }
}
