import fs from 'fs';
import * as pkyaml from '../pk-yaml';
import { IPkz } from "../pk-template/types";
import { basename } from "path";

export class PkzDeserializer {
    deserialize(path: string, text: string): IPkz {
        const patterns = {
            '# CONTEXT=': (pkt: IPkz, v: string) => pkt.context = v,
        } as any;

        const pkz: IPkz = {
            name: '',
            args: {
                files: [],
                values: {},
                options: {},
            },
            context: '',
            objects: [],
        };
        pkz.name = basename(path);

        if (!text.startsWith('# PKZ=')) {
            console.log(`${path} is not a valid pkt generated yaml.`);
            process.exit(1);
        }
        const lineEnd = text.indexOf('\n');
        pkz.args = JSON.parse(text.substring(6, lineEnd));

        const lines = text.split('\n');
        for (const line of lines) {
            if (!line.startsWith('#'))
                break;

            for (const pattern in patterns) {
                if (line.startsWith(pattern)) {
                    const value = line.substr(pattern.length).trim();
                    const setter = patterns[pattern];
                    setter(pkz, value);
                }
            }
        }
        pkz.objects = pkyaml.parseYamlAll(text);

        return pkz;
    }
}
