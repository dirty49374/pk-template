import { IPkConf } from ".";
import { dumpYaml, parseYaml } from "../pk-yaml";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

export class PkConf {
    static FILENAME = '.pk.yaml';

    constructor(public data: IPkConf) {
    }

    static load(path?: string) {
        path = path || join(homedir(), PkConf.FILENAME);

        if (!existsSync(path)) {
            return null;
        }
        const content = readFileSync(path, 'utf8');
        return new PkConf(parseYaml(content));
    }

    static save(conf: PkConf, path?: string) {
        path = path || join(homedir(), PkConf.FILENAME);

        const content = dumpYaml(conf.data);
        writeFileSync(path, content, 'utf8');
    }
}
