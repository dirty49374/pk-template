import path from 'path';
import { loaders } from '../pk-lib';

function version() {
    const pkg = loaders.yaml(null, path.join(__dirname, '../package.json'));
    console.log(pkg.version);
}

export default version;