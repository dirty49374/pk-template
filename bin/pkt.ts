#!/usr/bin/env node
import fs from 'fs';
import pkt from '../lib';
import help from './help';
import chalk from 'chalk';
import jsyaml from 'js-yaml';
import process from 'process';
import genout from './genout';
import version from './version';
import { ArgsBuilder } from './cmd';

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


    let args = new ArgsBuilder().build(argv, config);

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
