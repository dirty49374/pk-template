import jsyaml from "js-yaml";
import { IOutput } from "./output";
import { IOptions } from "../../pktlib/types";
import { IObject } from "../../common";

export class YamlOutput implements IOutput {
    constructor(private options: IOptions) { }

    *write(objects: IObject[]): Iterator<string> {
        for (let i = 0; i < objects.length; ++i) {
            const o = objects[i];
            if (o == null) {
                continue;
            }
            yield jsyaml.dump(o, { sortKeys: true });
            if (i + 1 != objects.length)
                yield '---';
        }
        yield '';
    }
}
