import fs from "fs";
import url from "url";
import path from "path";
import { IPktModule, PKTLIBS_DIR_NAME, IPktModuleLoaded, PKMODULE_FILE_NAME } from "./types";

export class PktModule {
    public homeUri: string;
    constructor(public uri: string, public module: IPktModule) {
        this.homeUri = path.dirname(uri);
    }

    add(repositoryName: string, repositoryUri: string): any {
        if (!this.module.repositories) {
            this.module.repositories = {};
        }
        this.module.repositories[repositoryName] = repositoryUri;
    }

    resolve(mpath: string) {
        const rpath = mpath.substring(1);
        const spl = rpath.split('/');
        const ruri = this.module.repositories[spl[0]];
        if (ruri) {
            const uri = url.resolve(this.uri, ruri);
            spl.shift();
            const final = path.join(uri, spl.join('/'));
            return final;
        }
        return path.join(this.homeUri, rpath);
    }

    save() {
        const json = JSON.stringify(this.module, null, 4);
        fs.writeFileSync(this.uri, json, 'utf8');
    }

    static TryLoadModule(uri: string): string | null {
        try {
            const json = fs.readFileSync(uri, 'utf8');
            return json;
        } catch (e) {
            return null;
        }
    }

    static FindPkModuleJson(uri: string): IPktModuleLoaded | null {
        uri = uri + '/';
        while (true) {
            let u = url.resolve(uri, PKMODULE_FILE_NAME);

            const json = PktModule.TryLoadModule(u);
            if (json) {
                if (!path.isAbsolute(u) && u[0] != '.') {
                    u = './' + u;
                }
                return { module: JSON.parse(json) as any, uri: u };
            }

            const parent = url.resolve(uri, '..');
            if (parent == null || parent === uri) {
                return null;
            }

            uri = parent;
        }
    }

    static Load(uri: string): PktModule | null {
        const loaded = PktModule.FindPkModuleJson(uri);
        return loaded
            ? new PktModule(loaded.uri, loaded.module)
            : null;
    }
}
