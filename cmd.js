#!/usr/bin/env node

const fs = require('fs');
const process = require('process');
const glob = require('glob');
const jsyaml = require('js-yaml');
const { expand } = require('./lib');

function parseArgs() {
    const argv = require('yargs')
        .version(false)
        .help(false)
        .boolean(['v', 'i'])
        .argv;

    const args = {
        options: {},
        values: {},
        files: argv._
    };

    Object.keys(argv).forEach(k => {
        if (k.length === 1) {
            if (k !== '_')
                args.options[k] = argv[k];
        } else if (k[0] != '$') {
            args.values[k] = argv[k];
        }
    });

    return args;
}

function expandGlobs(path) {
    if (path.toLowerCase().startsWith('http://') ||
        path.toLowerCase().startsWith('https://'))
        return [ path ];
    if (path.includes('?') || path.includes('*') || path.includes('+'))
        return glob.sync(path);
    return [ path ];
}

function setup() {
    const args = parseArgs();
    const values = args.values;
    const options = {
        verbose: !!args.options.v,
        stdin: !!args.options.i
    };
    const files = args.files.map(expandGlobs)
        .reduce((sum, list) => sum.concat(list), []);

    return { values, files, options };
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

function main() {

    const setting = setup();
    
    if (setting.options.stdin) {
        readStdinUntilEnd(text => {
            const objects = jsyaml.loadAll(text);
            const yaml = expand(objects, setting.values, setting.files, setting.options);
            console.log(yaml);
        })
    } else {
        const yaml = expand([], setting.values, setting.files, setting.options);
        console.log(yaml);
    }
}

main();
