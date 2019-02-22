import { IPktOptions } from "../../pk-lib/types";
import { IOutput } from "./output";
import { IObject } from "../../common";

export class JsonOutput implements IOutput {
    constructor(private options: IPktOptions) { }

    *write(objects: IObject[]): Iterator<string> {
        if (this.options.json) {
            if (this.options.indent) {
                yield JSON.stringify(objects, null, 4);
            } else {
                yield JSON.stringify(objects);
            }
        } else {
            if (this.options.indent) {
                yield JSON.stringify(objects[0], null, 4);
            } else {
                yield JSON.stringify(objects[0]);
            }
        }
    }
}
