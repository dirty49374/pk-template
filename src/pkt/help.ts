import pkyaml from 'js-yaml';
import { loadYamlFile } from '../pk-yaml';

function helpPkt(url: string): void {
    console.log('- url:', url);
    const yaml = loadYamlFile(url);
    const schema = yaml.schema;
    if (!schema) return;
    const props = pkyaml.dump(schema).split('\n')
        .map(line => '  ' + line)
        .join('\n');
    console.log(props);
}

function help(files: string[]): void {
    console.log('USAGE: pkt [options] ...files');
    console.log();

    console.log('OPTIONS:');
    console.log('   -h           : help');
    console.log('   -v           : version');
    console.log('   -d           : show nodejs errors and callstack');
    console.log();
    console.log('   -i           : load yamls from stdin as initial objects');
    console.log();
    console.log('   -e           : set environment name');
    console.log();
    console.log('   -B           : bash script output');
    console.log('   -J           : json output');
    console.log('   -T           : pkt output');
    console.log();
    console.log('   -P pkgid     : make pkt package file (pkgid.pkz)');
    console.log('   -U pkgid     : update pkt package file (needs -W flags to overwrite)');
    console.log('   -W           : write pkt package');
    console.log();
    console.log('   -K path      : write kubeconfig path inside yaml file as comment');
    console.log('   -C name      : write cluster name inside yaml file as comment');
    console.log('   -X name      : write context name path inside yaml file as comment');
    console.log('   -N namespace : write namespace name inside yaml file as comment');

    console.log();
    console.log('   --name value : assign value to name, ex) --image nginx');
    console.log('   --name path@ : assign yaml content to name');
    console.log();

    if (files && files.length) {
        console.log('FILES:');

        for (const file of files) {
            if (file.toLowerCase().endsWith('.pkt')) {
                helpPkt(file);
            } else {
                console.log('- url:', file);
            }
        }
    }
}

export default help;
