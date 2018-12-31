#!/usr/bin/env node

const process = require('process');
const glob = require('glob');
const jsyaml = require('js-yaml');
const pkt = require('../src');
const chalk = require('chalk');
const genout = require('./genout');
const help = require('./help');
const version = require('./version');

function expandValues(values) {
    Object.keys(values).forEach(k => {
        if (k.endsWith('@')) {
            const path = values[k]
            const value = pkt.loaders.yaml(null, path, true)

            delete values[k]
            values[k.substr(0, k.length-1)] = value
        }
    });
    return values
}

function filterValues(argv) {
    const values = {}
    Object.keys(argv).forEach(k => {
        if (k[0] != '$') {
            values[k] = argv[k];
        }
    });
    return values
}

function buildValues(config, argv) {
    return expandValues(filterValues(argv))
}

function buildFiles(config, argv) {
    return argv._.map(expandGlobs)
        .reduce((sum, list) => sum.concat(list), [])
        .map(p => config.resolve(p))
}

function buildOptions(argv) {
    return {
        stdin: !!argv.i,
        help: !!argv.h,
        version: !!argv.v,
        debug: !!argv.d,
        shellscript: !!argv.x,
        json: !!argv.j,
        json1: !!argv.J,
        indent: !!argv.n,
    }
}

function parseArgs(config) {
    const argv = require('yargs')
        .version(false)
        .help(false)
        .boolean(['i', 'h', 'v', 'd', 'x', 'j', 'n', 'J' ])
        .argv;

    const values = buildValues(config, argv)
    const files = buildFiles(config, argv)
    const options = buildOptions(argv)

    return { options, values, files, };
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
        const userdata = {};
        const yaml = pkt.runtimes.exec(objects, values, files, config, userdata);

        const output = getout(yaml, options, userdata)
        console.log(output);
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

function main() {
    const config = pkt.configs.load();

    const args = parseArgs(config);
    if (args.options.version) {
        version();
        return;
    }

    if (args.options.help || args.files.length == 0) {
        help(args);
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
