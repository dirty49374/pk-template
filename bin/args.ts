import fs from 'fs';
import path from 'path';
import glob from 'glob';
import { IValues, loaders, IOptions, IConfig } from '../lib';


export interface IArgs {
    options: IOptions;
    files: string[];
    values: IValues;
}

export class ArgsBuilder {
    private expandValues(values: IValues): any {
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
        const values: IValues = {}
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

    buildOptions(argv: string[], yargv: any) {
        const options: IOptions = { argv, cwd: process.cwd() };
        if ('i' in yargv) options.stdin = !!yargv.i;
        if ('h' in yargv) options.help = !!yargv.h;
        if ('v' in yargv) options.version = !!yargv.v;
        if ('d' in yargv) options.debug = !!yargv.d;
        if ('x' in yargv) options.shellscript = !!yargv.x;
        if ('j' in yargv) options.json = !!yargv.j;
        if ('J' in yargv) options.json1 = !!yargv.J;
        if ('P' in yargv) options.pkt = !!yargv.P;
        if ('n' in yargv) options.indent = !!yargv.n;
        if ('u' in yargv) {
            options.update = yargv.u;
            if (options.update_write !== true) {
                options.update_write = false;
            }
        }
        if ('U' in yargv) {
            options.update_write = yargv.U;
        }
        if ('K' in yargv) options.kubeconfig = yargv.K;
        if ('C' in yargv) options.kubecluster = yargv.C;
        if ('X' in yargv) options.kubecontext = yargv.X;
        if ('N' in yargv) options.kubenamespace = yargv.N;
        if ('A' in yargv) options.apply = !!yargv.A;
        
        return options;
    }
    
    build(argv: string[], config: IConfig): IArgs {
        const yargv = require('yargs/yargs')(argv)
            .version(false)
            .help(false)
            .boolean(['i', 'h', 'v', 'd', 'x', 'j', 'n', 'J', 'P', 'U' ])
            .argv;
    
        const values = this.buildValues(config, yargv)
        const files = this.buildFiles(config, yargv)
        const options = this.buildOptions(argv, yargv)
    
        return { options, values, files, };
    }
}
