const jsyaml = require('js-yaml');
const pkt = require('../src');

function helpPkt(url) {
    console.log('- url:', url);
    const yaml = pkt.loaders.yaml(null, url);
    const schema = yaml.schema;
    if (!schema) return;
    const props = jsyaml.dump(schema).split('\n')
        .map(line => '  ' + line)
        .join('\n');
    console.log(props);
}

function help(args) {
    console.log('USAGE: pkt [options] ...files');
    console.log();

    console.log('OPTIONS:');
    console.log('   -h           : help');
    console.log('   -v           : version');
    console.log('   -x           : generate shell script');
    console.log('   -d           : show nodejs errors and callstack');
    console.log('   -i           : load yamls from stdin as initial objects');
    console.log('   --name value : assign value to name');
    console.log('   --name path@ : assign yaml content to name');
    console.log();

    if (args.files.length) {
        console.log('FILES:');

        for (const file of args.files) {
            if (file.toLowerCase().endsWith('.pkt')) {
                helpPkt(file);
            } else {
                console.log('- url:', file);
            }
        }
    }
}

module.exports = help
