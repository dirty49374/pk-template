import url from 'url';
import { join, isAbsolute } from 'path';
import { PkProjectConf } from '../pk-conf/projectConf';
import { MODULE_DIR } from '../pk-conf/module';

export class PathResolver {
    public uri: string;
    constructor(uri: string | undefined) {
        if (uri) {
            this.uri = uri;
        } else {
            this.uri = process.cwd();
        }
    }

    resolve(rpath: string): string {
        if (!rpath) {
            throw new Error(`invalid path (${rpath})`)
        }

        if (typeof rpath !== 'string') {
            throw new Error(`path should be string (${rpath})`);
        }

        if (rpath.startsWith('~/')) {
            const { root } = PkProjectConf.find(this.uri);
            if (root) {
                return join(root, MODULE_DIR, rpath.substr(1));
            }
            throw new Error(`cannot resolve path ${rpath}, not in module`);
        }

        const isAbs = isAbsolute(rpath);
        if (isAbs) {
            return rpath;
        }

        // relative path
        const resolved = url.resolve(this.uri, rpath);
        return resolved;
    }
}
