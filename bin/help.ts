import jsyaml from 'js-yaml';
import { loaders } from '../lib';

function helpPkt(url: string): void {
    console.log('- url:', url);
    const yaml = loaders.yaml(null, url);
    const schema = yaml.schema;
    if (!schema) return;
    const props = jsyaml.dump(schema).split('\n')
        .map(line => '  ' + line)
        .join('\n');
    console.log(props);
}

function help(args: any): void {
    console.log('USAGE: pkt [options] ...files');
    console.log();

    console.log('OPTIONS:');
    console.log('   -h           : help');
    console.log('   -v           : version');
    console.log('   -x           : generate shell script');
    console.log('   -d           : show nodejs errors and callstack');
    console.log();
    console.log('   -i           : load yamls from stdin as initial objects');
    console.log();
    console.log('   -x           : shell script output');
    console.log('   -A           : bash script output');
    console.log('   -j           : json output');
    console.log('   -P           : pkt output');
    console.log();
    console.log('   -u yamlpath  : test changes for yaml files previously build');
    console.log('   -U           : write changes');
    console.log();
    console.log('   -K path      : write kubeconfig path inside yaml file as comment');
    console.log('   -C name      : write cluster name inside yaml file as comment');
    console.log('   -X name      : write context name path inside yaml file as comment');
    console.log('   -N namespace : write namespace name inside yaml file as comment');

    console.log();
    console.log('   --name value : assign value to name, ex) --image nginx');
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

export default help;
