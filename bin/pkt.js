#!/usr/bin/env node

const process = require('process');
const glob = require('glob');
const jsyaml = require('js-yaml');
const pkt = require('../src');
const chalk = require('chalk');
const path = require('path');

function parseArgs(config) {
    const argv = require('yargs')
        .version(false)
        .help(false)
        .boolean(['i', 'h', 'v', 'd'])
        .argv;

    const options = {};
    const values = {};
    Object.keys(argv).forEach(k => {
        if (k.length === 1) {
            if (k !== '_')
                options[k] = argv[k];
        } else if (k[0] != '$') {
            values[k] = argv[k];
        }
    });

    const args = {
        options: {
            stdin: !!options.i,
            help: !!options.h,
            version: !!options.v,
            debug: !!options.d,
        },
        values: values,
        files: argv._.map(expandGlobs)
            .reduce((sum, list) => sum.concat(list), [])
            .map(p => config.resolve(p)),
    };

    return args;
}

function expandGlobs(path) {
    if (path.toLowerCase().startsWith('http://') ||
        path.toLowerCase().startsWith('https://') ||
        path[0] == ':')
        return [ path ];
    if (path.includes('?') || path.includes('*') || path.includes('+'))
        return glob.sync(path);
    return [ path ];
}

function readStdinUntilEnd(cb) {
    const chunks = [];

    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', function (chunk) {
        chunks.push(chunk);
    });

    process.stdin.on('end', function () {
        var all = chunks.join();
        cb(all);
    });
}

function run(objects, values, files, config, options) {
    objects = objects || [];
    try {
        const yaml = pkt.engine.exec(objects, values, files, config);
        console.log(yaml);
    } catch (e) {
        if (e.summary) {
            console.error(chalk.red('ERROR: ' + e.summary + ' in ' + e.uri));
            console.error(chalk.red('       ' + e.message));
        } else {
            console.error(chalk.red(e.message));
        }
        if (options.debug) {
            console.error(e);
        }
        process.exit(1);
    }
}

function helpPkt(url) {
    console.log('- url:', url);
    const yaml = pkt.load.yaml(null, url);
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
    console.log('   -i           : load yamls from stdin as initial objects');
    console.log('   --name value : assign name = value');
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

function version() {
    const pkg = pkt.load.yaml(path.join(__dirname, '../package.json'));
    console.log(pkg.version);
}

function main() {
    const config = pkt.configs.load();

    const args = parseArgs(config);
    if (args.options.help || args.files.length == 0) {
        help(args);
        return;
    }

    if (args.options.version) {
        version();
        return;
    }

    if (args.options.stdin) {
        readStdinUntilEnd(text => {
            const objects = jsyaml.loadAll(text);
            run(objects, args.values, args.files, config, args.options);
        })
    } else {
        run([], args.values, args.files, config, args.options);
    }
}

main();
