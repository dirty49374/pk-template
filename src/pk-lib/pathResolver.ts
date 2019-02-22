import url from 'url';
import path from 'path';
import { PktModule } from './module';

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
            // module path or lib path
            const module = PktModule.Load(this.uri);
            if (module) {
                return module.resolve(rpath);
            }
            throw new Error(`cannot resolve path ${rpath}, not in module`);
        }

        const isAbsolute = path.isAbsolute(rpath);
        if (isAbsolute) {
            return rpath;
        }

        // relative path
        const resolved = url.resolve(this.uri, rpath);
        return resolved;
    }
}
