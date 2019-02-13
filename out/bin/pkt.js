#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const help_1 = __importDefault(require("./help"));
const chalk_1 = __importDefault(require("chalk"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const process_1 = __importDefault(require("process"));
const genout_1 = __importDefault(require("./genout"));
const version_1 = __importDefault(require("./version"));
const cmd_1 = require("./cmd");
const lib_1 = require("../lib");
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
        const yaml = lib_1.runtimes.exec(objects, values, files, config, userdata);
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
    const config = lib_1.configs.load();
    let args = new cmd_1.ArgsBuilder().build(argv, config);
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
