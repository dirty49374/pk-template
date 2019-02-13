"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const glob_1 = __importDefault(require("glob"));
const lib_1 = require("../lib");
class ArgsBuilder {
    expandValues(values) {
        Object.keys(values).forEach(k => {
            if (k.endsWith('@')) {
                const path = values[k];
                const value = lib_1.loaders.yaml(null, path);
                delete values[k];
                values[k.substr(0, k.length - 1)] = value;
            }
        });
        return values;
    }
    filterValues(argv) {
        const values = {};
        Object.keys(argv).forEach(k => {
            if (k[0] != '$') {
                values[k] = argv[k];
            }
        });
        return values;
    }
    buildValues(config, argv) {
        return this.expandValues(this.filterValues(argv));
    }
    expandLibPath(p) {
        if (p.length === 0 || p[0] !== '@') {
            return p;
        }
        p = p.substr(1);
        if (fs_1.default.existsSync(p)) {
            return p;
        }
        let cur = process.cwd();
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
    expandGlobs(path) {
        if (path.toLowerCase().startsWith('http://') ||
            path.toLowerCase().startsWith('https://') ||
            path[0] == ':')
            return [path];
        if (path.includes('?') || path.includes('*') || path.includes('+'))
            return glob_1.default.sync(path);
        return [path];
    }
    buildFiles(config, argv) {
        return argv._.map(this.expandGlobs)
            .reduce((sum, list) => sum.concat(list), [])
            .map((p) => config.resolve(p))
            .map((p) => this.expandLibPath(p));
    }
    buildOptions(argv) {
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
    build(argv, config) {
        const yargv = require('yargs/yargs')(argv)
            .version(false)
            .help(false)
            .boolean(['i', 'h', 'v', 'd', 'x', 'j', 'n', 'J', 'P'])
            .argv;
        const values = this.buildValues(config, yargv);
        const files = this.buildFiles(config, yargv);
        const options = this.buildOptions(yargv);
        return { options, values, files, };
    }
}
exports.ArgsBuilder = ArgsBuilder;
