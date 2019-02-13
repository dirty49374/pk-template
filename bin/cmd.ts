import fs from 'fs';
import path from 'path';
import glob from 'glob';
import { IValues, loaders, IOptions } from '../lib';


export interface IArgs {
    options: IOptions;
    files: string[];
    values: IValues;
}

export class ArgsBuilder {
    private expandValues(values: any): any {
        Object.keys(values).forEach(k => {
            if (k.endsWith('@')) {
                const path = values[k]
                const value = loaders.yaml(null, path)
    
                delete values[k]
                values[k.substr(0, k.length-1)] = value
            }
        });
        return values;
    }
    
    private filterValues(argv: any): any {
        const values: any = {}
        Object.keys(argv).forEach(k => {
            if (k[0] != '$') {
                values[k] = argv[k];
            }
        });
        return values
    }
    
    private buildValues(config: IConfig, argv: any): any {
        return this.expandValues(this.filterValues(argv));
    }
    
    private expandLibPath(p: string): string {
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

    private expandGlobs(path: string): string[] {
        if (path.toLowerCase().startsWith('http://') ||
            path.toLowerCase().startsWith('https://') ||
            path[0] == ':')
            return [ path ];
        if (path.includes('?') || path.includes('*') || path.includes('+'))
            return glob.sync(path);
        return [ path ];
    }
    
    private buildFiles(config: IConfig, argv: any): string[] {
        return argv._.map(this.expandGlobs)
            .reduce((sum: string[], list: string[]) => sum.concat(list), [])
            .map((p: string) => config.resolve(p))
            .map((p: string) => this.expandLibPath(p))
    }

    buildOptions(argv: any) {
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
    
    build(argv: string[], config: IConfig): IArgs {
        const yargv = require('yargs/yargs')(argv)
            .version(false)
            .help(false)
            .boolean(['i', 'h', 'v', 'd', 'x', 'j', 'n', 'J', 'P' ])
            .argv;
    
        const values = this.buildValues(config, yargv)
        const files = this.buildFiles(config, yargv)
        const options = this.buildOptions(yargv)
    
        return { options, values, files, };
    }
}
