import jsyaml from "js-yaml";
import { IOutput } from "./output";
import { IObject, IOptions } from "../../lib/types";

export class YamlOutput implements IOutput {
    constructor(private options: IOptions) {}
    
    *write(objects: IObject[]): Iterator<string> {
        for (const o of objects) {
            yield '---';
            if (o == null) {
                continue;
            }
            yield jsyaml.dump(o);
        }
        yield '';
    }
}
