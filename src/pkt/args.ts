import fs from 'fs';
import path from 'path';
import { IValues, IPktOptions } from '../pk-template';
import { loadYamlFile } from '../pk-yaml';
import { bindYargsOption, buildCommandDescription } from '../pk-yargs/bindOption';


export interface IPktArgs {
    options: IPktOptions;
    file: string;
    env?: string;
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
            if (k[0] != '$' && k.length > 1) {
                values[k] = argv[k];
            }
        });
        return values
    }

    private buildValues(argv: any): any {
        const values = this.expandValues(this.filterValues(argv));
        delete values._;

        return values;
    }

    buildOptions(yargv: any) {
        const options: IPktOptions = {};
        if (yargv.i) options.stdin = true;
        if (yargv.j) options.json = true;
        if (yargv.d) options.debug = true;
        if (yargv.v) options.version = true;
        if (yargv.h) options.help = true;

        return options;
    }

    build(argv: string[]): IPktArgs {
        const baseOption = (argv: string[]) => {
            return require('yargs/yargs')(argv)
                .scriptName("pkt")
                .option('i', { description: 'read yaml initial objects from stdin', boolean: true })
                .option('j', { description: 'json output', boolean: true })
                .option('d', { description: 'show nodejs errors and callstacks', boolean: true })
                .option('v', { description: 'show version', boolean: true })
                .option('h', { description: 'show help', boolean: true })
                .version(false)
                .help(false)
                ;
        };

        let yargs = baseOption(argv).usage('pkt file');
        let yargv = yargs.argv;
        if (yargv._.length === 1) {
            const file = yargv._[0];
            const pkt = loadYamlFile(file);

            yargs = bindYargsOption(baseOption(argv), pkt);
            const desc = buildCommandDescription(pkt);
            let usage = desc
                ? `pkt ${file} - ${desc}`
                : `pkt ${file}`;
            yargs.usage(usage);
            yargv = yargs.argv;
        }

        if (yargv.h || yargv._.length !== 1) {
            yargs.showHelp();
            process.exit(0);
        }

        const file = yargv._[0];
        const values = this.buildValues(yargv)
        const options = this.buildOptions(yargv)

        return { options, values, file, env: options.env };
    }
}
