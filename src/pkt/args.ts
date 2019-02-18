import fs from 'fs';
import path from 'path';
import { IValues, loaders, IOptions, IConfig } from '../pk-lib';
import { getGlob } from '../pk-lib/lazy';


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
                values[k.substr(0, k.length - 1)] = value
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

    private buildFiles(config: IConfig, argv: any): string[] {
        return argv._.reduce((sum: string[], list: string[]) => sum.concat(list), [])
            .map((p: string) => config.resolve(p))
            .map((p: string) => this.expandLibPath(p))
    }

    buildOptions(argv: string[], yargv: any) {
        const options: IOptions = { argv, cwd: process.cwd() };
        if (yargv.h) options.help = true;
        if (yargv.v) options.version = true;
        if (yargv.d) options.debug = true;

        if (yargv.i) options.stdin = true;

        if (yargv.B) options.bash = true;
        if (yargv.J) options.json = true;
        if (yargv.T) options.pkt = true;

        // if ('1' in yargv) options.json1 = !!yargv.J;
        // if ('n' in yargv) options.indent = !!yargv.n;

        if (yargv.P) {
            options.pkt_package = yargv.P as string;
            if (options.pkt_package.includes('.') || options.pkt_package.includes('/')) {
                console.error(`${options.pkt_package} is not valid pkt-apply-id`);
                process.exit(1);
                throw new Error("impossible");
            }
        }
        if (yargv.U) {
            options.pkt_package = yargv.U as string;
            if (options.pkt_package.includes('.') || options.pkt_package.includes('/')) {
                console.error(`${options.pkt_package} is not valid pkt-apply-id`);
                process.exit(1);
                throw new Error("impossible");
            }
            options.pkt_package_update = true;
            if (options.pkt_package_update_write !== true) {
                options.pkt_package_update_write = false;
            }
        }
        if (yargv.W) {
            options.pkt_package_update_write = yargv.W;
        }

        if (yargv.K) options.kubeconfig = yargv.K;
        if (yargv.C) options.kubecluster = yargv.C;
        if (yargv.X) options.kubecontext = yargv.X;
        if (yargv.N) options.kubenamespace = yargv.N;

        return options;
    }

    build(argv: string[], config: IConfig): IArgs {
        const yargv = require('yargs/yargs')(argv)
            .version(false)
            .help(false)
            .boolean([
                'h', 'v', 'd',
                'i',
                'S', 'J', 'T',
                'W'
            ])
            .argv;

        const values = this.buildValues(config, yargv)
        const files = this.buildFiles(config, yargv)
        const options = this.buildOptions(argv, yargv)

        return { options, values, files, };
    }
}
