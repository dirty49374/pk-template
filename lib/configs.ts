const loaders = require('./loaders');
const path = require('path');

class Config {
    repositories: any;
    constructor({ repositories }: any) {
        this.repositories = repositories || {};
    }

    resolve(uri: string): string {
        if (uri[0] == ':') {
            const resolved = this.repositories[uri.substr(1)];
            if (!resolved) {
                throw new Error(`unknown repo ${uri}`)
            }
            return resolved;
        }
        return uri;
    }
}

export function load(): IConfig {
    try {
        const home = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
        const confPath = path.join(home, 'pkt.conf');
        let config = loaders.yaml(null, confPath);
        if (!config) config = {};
        return new Config(config);
    } catch (e) {
        return new Config({ repositories: null });
    }
}
