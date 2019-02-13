import path from 'path';
import pkt from '../lib';

function version() {
    const pkg = pkt.loaders.yaml(null, path.join(__dirname, '../package.json'), true);
    console.log(pkg.version);
}

export default version;
