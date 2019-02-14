import { IObject, IOptions } from "../../lib/types";
import { IOutput } from "./output";

export class JsonOutput implements IOutput {
    constructor(private options: IOptions) {}
    
    write(objects: IObject[]) {
        if (this.options.json) {
            if (this.options.indent) {
                console.log(JSON.stringify(objects, null, 4));
            } else {
                console.log(JSON.stringify(objects));
            }
        } else {
            if (this.options.indent) {
                return JSON.stringify(objects[0], null, 4);
            } else {
                return JSON.stringify(objects[0]);
            }
        }
    }
}
