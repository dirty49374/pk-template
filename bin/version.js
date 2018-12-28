const path = require('path');
const pkt = require('../src');

function version() {
    const pkg = pkt.loaders.yaml(null, path.join(__dirname, '../package.json'), true);
    console.log(pkg.version);
}

module.exports = version
