import url from 'url';
import { join, isAbsolute } from 'path';
import { PkConf } from '../pk-conf/conf';

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

        if (rpath.startsWith(':')) {
            const { dir } = PkConf.find(this.uri);
            if (dir) {
                return join(dir, 'pk_modules', rpath.substr(1));
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
