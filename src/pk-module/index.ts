import fs from "fs";
import url from "url";
import path from "path";
import { PKMODULE_FILE_NAME } from "../pk-lib/types";

export interface IPkModuleLoad {
    module: IPktModule;
    uri: string;
}

export interface IPktModule {
    repositories: { [id: string]: string };
}

export class PkModule {
    constructor(private uri: string, private module: IPktModule) {
    }

    static TryLoadModule(uri: string): string | null {
        try {
            const json = fs.readFileSync(uri, 'utf8');
            return json;
        } catch (e) {
            return null;
        }
    }

    static FindModuleDir(uri: string): IPkModuleLoad | null {
        uri = uri + '/';
        while (true) {
            const u = url.resolve(uri, PKMODULE_FILE_NAME);
            console.log('testing...', uri, u);

            const json = PkModule.TryLoadModule(u);
            if (json) {
                return { module: JSON.stringify(json) as any, uri: path.dirname(u) };
            }

            const parent = url.resolve(uri, '..');
            if (!parent || parent === uri) {
                return null;
            }

            uri = parent;
        }
    }

    static Load(uri: string): PkModule | null {
        const moduleDir = PkModule.FindModuleDir(uri);
        return moduleDir
            ? new PkModule(moduleDir.uri, moduleDir.module)
            : null;
    }
}
