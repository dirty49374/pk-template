const loaders = require('./loaders');

class Config {
    constructor({ repositories }) {
        this.repositories = repositories || {};
    }

    resolve(uri) {
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

const configs = {
    load() {
        try {
            const home = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
            const confPath = path.join(home, 'pkt.conf');
            const config = loaders.yaml(null, confPath);
            if (!config) config = {};
            return new Config(config);
        } catch (e) {
            return new Config({});
        }
    }
}

module.exports = configs;
