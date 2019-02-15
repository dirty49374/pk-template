import { IOptions } from "../../pktlib/types";
import jsyaml from "js-yaml";
import { IOutput } from "./output";
import { IObject } from "../../common";

export class PktOutput implements IOutput {
    constructor(private options: IOptions) { }

    *write(objects: IObject[]): Iterator<string> {
        var pkt = {
            routine: objects.map(o => ({ add: o }))
        }
        const yaml = jsyaml.dump(pkt);
        yield yaml;
    }
}
