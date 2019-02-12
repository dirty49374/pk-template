#!/usr/bin/env node
const fs = require('fs');
const pkt = require('../src');
const glob = require('glob');
const path = require('path');
const help = require('./help');
const process = require('process');
const jsyaml = require('js-yaml');
const chalk = require('chalk');
const jsyaml = require('js-yaml');
const process = require('process');
const genout = require('./genout');
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

function expandLibPath(p) {
    if (p.length === 0 || p[0] !== '@') {
        return p;
    }

    p = p.substr(1)

    if (fs.existsSync(p)) {
        return p;
    }

    let cur = process.cwd();
    while (true) {
        const libdir = path.join(cur, "pkt_lib");
        if (fs.existsSync(libdir)) {
            const rpath = path.join(libdir, p);
            if (fs.existsSync(rpath))
                return rpath;
        }

        const parent = path.dirname(cur)
        if (parent == cur)
            return p;
        cur = parent;
    }
}

function buildFiles(config, argv) {
    return argv._.map(expandGlobs)
        .reduce((sum, list) => sum.concat(list), [])
        .map(p => config.resolve(p))
        .map(p => expandLibPath(p))
}

function buildOptions(argv) {
    var options = {
        stdin: !!argv.i,
        help: !!argv.h,
        version: !!argv.v,
        debug: !!argv.d,
        shellscript: !!argv.x,
        json: !!argv.j,
        json1: !!argv.J,
        indent: !!argv.n,
    }
    if (argv.S) options.save = argv.S;
    if (argv.L) options.load = argv.L;
    return options;
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

        const output = genout(yaml, options, userdata)
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

    let args = parseArgs(config);

    if (args.options.save) {
        const fn = args.options.save + '.pkv';
        delete args.options['save'];
        const txt = jsyaml.dump(args);
        fs.writeFileSync(fn, txt, { encoding: 'utf8' });
        return;
    } 
    
    if (args.options.load) {
        const txt = fs.readFileSync(args.options.load, { encoding: 'utf8' });
        delete args.options.load;
        const saved = jsyaml.load(txt);
        args = {
            values: { ...saved.values, ...args.values, },
            options: { ...saved.options, ...args.options, },
            files: saved.files.concat(args.files),
        };
    }

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
