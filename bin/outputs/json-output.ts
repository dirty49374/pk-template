import { IObject, IOptions } from "../../lib/types";
import { IOutput } from "./output";

export class JsonOutput implements IOutput {
    constructor(private options: IOptions) {}
    
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
