#!/usr/bin/env node
import fs from 'fs';
import pkt from '../lib';
import glob from 'glob';
import path from 'path';
import help from './help';
import chalk from 'chalk';
import jsyaml from 'js-yaml';
import process from 'process';
import genout from './genout';
import version from './version';

function expandValues(values: any): any {
    Object.keys(values).forEach(k => {
        if (k.endsWith('@')) {
            const path = values[k]
            const value = pkt.loaders.yaml(null, path, true)

            delete values[k]
            values[k.substr(0, k.length-1)] = value
        }
    });
    return values;
}

function filterValues(argv: any): any {
    const values: any = {}
    Object.keys(argv).forEach(k => {
        if (k[0] != '$') {
            values[k] = argv[k];
        }
    });
    return values
}

function buildValues(config: IConfig, argv: any): any {
    return expandValues(filterValues(argv));
}

function expandLibPath(p: string): string {
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

function buildFiles(config: IConfig, argv: any): string[] {
    return argv._.map(expandGlobs)
        .reduce((sum: string[], list: string[]) => sum.concat(list), [])
        .map((p: string) => config.resolve(p))
        .map((p: string) => expandLibPath(p))
}

function buildOptions(argv: any) {
    const options: IOption = {}
    if ('i' in argv) options.stdin = !!argv.i;
    if ('h' in argv) options.help = !!argv.h;
    if ('v' in argv) options.version = !!argv.v;
    if ('d' in argv) options.debug = !!argv.d;
    if ('x' in argv) options.shellscript = !!argv.x;
    if ('j' in argv) options.json = !!argv.j;
    if ('J' in argv) options.json1 = !!argv.J;
    if ('P' in argv) options.pkt = !!argv.P;
    if ('n' in argv) options.indent = !!argv.n;
    if ('S' in argv) options.save = argv.S;
    if ('L' in argv) options.load = argv.L;
    return options;
}

function parseArgs(oargv: any, config: IConfig) {
    const argv = require('yargs/yargs')(oargv)
        .version(false)
        .help(false)
        .boolean(['i', 'h', 'v', 'd', 'x', 'j', 'n', 'J', 'P' ])
        .argv;

    const values = buildValues(config, argv)
    const files = buildFiles(config, argv)
    const options = buildOptions(argv)

    return { options, values, files, };
}

function expandGlobs(path: string): string[] {
    if (path.toLowerCase().startsWith('http://') ||
        path.toLowerCase().startsWith('https://') ||
        path[0] == ':')
        return [ path ];
    if (path.includes('?') || path.includes('*') || path.includes('+'))
        return glob.sync(path);
    return [ path ];
}

function readStdinUntilEnd(cb: (text: string)=> void) {
    const chunks: any[] = [];

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

function run(objects: any[], values: any, files: string[], config: IConfig, options: IOption) {
    objects = objects || [];
    try {
        const userdata = {};
        const yaml = pkt.runtimes.exec(objects, values, files, config, userdata);

        const output = genout(yaml, options);
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

function main(argv: any) {
    const config = pkt.configs.load();

    let args = parseArgs(argv, config);

    if (args.options.save) {
        const fn = args.options.save;
        const optIndex = argv.indexOf('-S');
        argv.splice(optIndex, 2);
        argv.push('$@');

        const txt = '#!/bin/sh\n\npkt ' + argv.join(' \\\n\t') + '\n';
        fs.writeFileSync(fn, txt, { mode: 0o755, encoding: 'utf8' });
        return;
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
        readStdinUntilEnd((text: string): void => {
            const objects = jsyaml.loadAll(text);
            run(objects, args.values, args.files, config, args.options);
        });
    } else {
        run([], args.values, args.files, config, args.options);
    }
}

main(process.argv.slice(2));
