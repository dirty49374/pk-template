import path from 'path';
import { loadYamlFile } from '../pk-yaml';

function version() {
    const pkg = loadYamlFile(path.join(__dirname, '../package.json'));
    console.log(pkg.version);
}

export default version;
