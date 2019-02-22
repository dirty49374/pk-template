import fs from 'fs';
import path from 'path';
import { IValues, IPktOptions } from '../pk-lib';
import { loadYamlFile } from '../pk-yaml';


export interface IPktArgs {
    options: IPktOptions;
    files: string[];
    values: IValues;
}

export class ArgsBuilder {
    private expandValues(values: IValues): any {
        Object.keys(values).forEach(k => {
            if (k.endsWith('@')) {
                const path = values[k];
                const value = loadYamlFile(path);

                delete values[k];
                values[k.substr(0, k.length - 1)] = value;
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

    private buildValues(argv: any): any {
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

    private buildFiles(argv: any): string[] {
        return argv._.reduce((sum: string[], list: string[]) => sum.concat(list), [])
            .map((p: string) => this.expandLibPath(p))
    }

    buildOptions(argv: string[], yargv: any) {
        const options: IPktOptions = { argv, cwd: process.cwd() };
        if (yargv.h) options.help = true;
        if (yargv.v) options.version = true;
        if (yargv.d) options.debug = true;

        if (yargv.i) options.stdin = true;

        if (yargv.J) options.json = true;
        if (yargv.T) options.pkt = true;

        // if ('1' in yargv) options.json1 = !!yargv.J;
        // if ('n' in yargv) options.indent = !!yargv.n;

        return options;
    }

    build(argv: string[]): IPktArgs {
        const yargv = require('yargs/yargs')(argv)
            .version(false)
            .help(false)
            .boolean([
                'h', 'v', 'd',
                'i',
                'S', 'J', 'T',
            ])
            .argv;

        const values = this.buildValues(yargv)
        const files = this.buildFiles(yargv)
        const options = this.buildOptions(argv, yargv)

        return { options, values, files, };
    }
}
