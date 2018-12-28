const pkt = require('../src');

function version() {
    const pkg = pkt.load.yaml(path.join(__dirname, '../package.json'));
    console.log(pkg.version);
}

module.exports = version
