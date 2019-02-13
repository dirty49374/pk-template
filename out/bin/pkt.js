#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const lib_1 = __importDefault(require("../lib"));
const glob_1 = __importDefault(require("glob"));
const path_1 = __importDefault(require("path"));
const help_1 = __importDefault(require("./help"));
const chalk_1 = __importDefault(require("chalk"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const process_1 = __importDefault(require("process"));
const genout_1 = __importDefault(require("./genout"));
const version_1 = __importDefault(require("./version"));
function expandValues(values) {
    Object.keys(values).forEach(k => {
        if (k.endsWith('@')) {
            const path = values[k];
            const value = lib_1.default.loaders.yaml(null, path, true);
            delete values[k];
            values[k.substr(0, k.length - 1)] = value;
        }
    });
    return values;
}
function filterValues(argv) {
    const values = {};
    Object.keys(argv).forEach(k => {
        if (k[0] != '$') {
            values[k] = argv[k];
        }
    });
    return values;
}
function buildValues(config, argv) {
    return expandValues(filterValues(argv));
}
function expandLibPath(p) {
    if (p.length === 0 || p[0] !== '@') {
        return p;
    }
    p = p.substr(1);
    if (fs_1.default.existsSync(p)) {
        return p;
    }
    let cur = process_1.default.cwd();
    while (true) {
        const libdir = path_1.default.join(cur, "pkt_lib");
        if (fs_1.default.existsSync(libdir)) {
            const rpath = path_1.default.join(libdir, p);
            if (fs_1.default.existsSync(rpath))
                return rpath;
        }
        const parent = path_1.default.dirname(cur);
        if (parent == cur)
            return p;
        cur = parent;
    }
}
function buildFiles(config, argv) {
    return argv._.map(expandGlobs)
        .reduce((sum, list) => sum.concat(list), [])
        .map((p) => config.resolve(p))
        .map((p) => expandLibPath(p));
}
function buildOptions(argv) {
    const options = {};
    if ('i' in argv)
        options.stdin = !!argv.i;
    if ('h' in argv)
        options.help = !!argv.h;
    if ('v' in argv)
        options.version = !!argv.v;
    if ('d' in argv)
        options.debug = !!argv.d;
    if ('x' in argv)
        options.shellscript = !!argv.x;
    if ('j' in argv)
        options.json = !!argv.j;
    if ('J' in argv)
        options.json1 = !!argv.J;
    if ('P' in argv)
        options.pkt = !!argv.P;
    if ('n' in argv)
        options.indent = !!argv.n;
    if ('S' in argv)
        options.save = argv.S;
    if ('L' in argv)
        options.load = argv.L;
    return options;
}
function parseArgs(oargv, config) {
    const argv = require('yargs/yargs')(oargv)
        .version(false)
        .help(false)
        .boolean(['i', 'h', 'v', 'd', 'x', 'j', 'n', 'J', 'P'])
        .argv;
    const values = buildValues(config, argv);
    const files = buildFiles(config, argv);
    const options = buildOptions(argv);
    return { options, values, files, };
}
function expandGlobs(path) {
    if (path.toLowerCase().startsWith('http://') ||
        path.toLowerCase().startsWith('https://') ||
        path[0] == ':')
        return [path];
    if (path.includes('?') || path.includes('*') || path.includes('+'))
        return glob_1.default.sync(path);
    return [path];
}
function readStdinUntilEnd(cb) {
    const chunks = [];
    process_1.default.stdin.resume();
    process_1.default.stdin.setEncoding('utf8');
    process_1.default.stdin.on('data', function (chunk) {
        chunks.push(chunk);
    });
    process_1.default.stdin.on('end', function () {
        var all = chunks.join();
        cb(all);
    });
}
function run(objects, values, files, config, options) {
    objects = objects || [];
    try {
        const userdata = {};
        const yaml = lib_1.default.runtimes.exec(objects, values, files, config, userdata);
        const output = genout_1.default(yaml, options);
        console.log(output);
    }
    catch (e) {
        if (e.summary) {
            console.error(chalk_1.default.red('ERROR: ' + e.summary + ' in ' + e.uri));
            console.error(chalk_1.default.red('       ' + e.message));
        }
        else {
            console.error(chalk_1.default.red(e.message));
        }
        if (options.debug) {
            console.error(e);
        }
        process_1.default.exit(1);
    }
}
function main(argv) {
    const config = lib_1.default.configs.load();
    let args = parseArgs(argv, config);
    console.log(args);
    if (args.options.save) {
        const fn = args.options.save;
        const optIndex = argv.indexOf('-S');
        argv.splice(optIndex, 2);
        argv.push('$@');
        const txt = '#!/bin/sh\n\npkt ' + argv.join(' \\\n\t') + '\n';
        fs_1.default.writeFileSync(fn, txt, { mode: 0o755, encoding: 'utf8' });
        return;
    }
    if (args.options.version) {
        version_1.default();
        return;
    }
    if (args.options.help || args.files.length == 0) {
        help_1.default(args);
        return;
    }
    if (args.options.stdin) {
        readStdinUntilEnd((text) => {
            const objects = js_yaml_1.default.loadAll(text);
            run(objects, args.values, args.files, config, args.options);
        });
    }
    else {
        run([], args.values, args.files, config, args.options);
    }
}
main(process_1.default.argv.slice(2));
