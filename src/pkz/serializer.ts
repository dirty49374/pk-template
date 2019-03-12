import * as pkyaml from '../pk-yaml';
import { IPkz } from "../pk-lib/types";

export class PkzSerializer {
    serialize(pkz: IPkz): string {
        const lines: string[] = [];

        lines.push(`# PKZ=${JSON.stringify(pkz.args)}`)
        lines.push(`# CONTEXT=${pkz.context || ""}`);

        lines.push(`#`);
        lines.push(`# APPLY:`);
        lines.push(`# - pkctl   : $ pkctl apply ${pkz.name}`);

        const options = []
        if (pkz.context) {
            options.push(`--context ${pkz.context}`);
        }
        lines.push(`# - kubectl : $ kubectl apply ${options.join(' ')} -f ./${pkz.name}`);

        lines.push(pkyaml.dumpYamlAll(pkz.objects));

        return lines.join('\n');
    }
}
