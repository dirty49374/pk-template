import { IObject, IOptions } from "../../lib/types";
import jsyaml from "js-yaml";
import { IOutput } from "./output";

export class PktOutput implements IOutput {
    constructor(private options: IOptions) {}
    
    write(objects: IObject[]) {
        var pkt = {
            routine: objects.map(o => ({ add: o }))
        }
        const yaml = jsyaml.dump(pkt);
        console.log(yaml);
    }
}
