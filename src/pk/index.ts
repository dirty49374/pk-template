import { PkProjectConf } from "../pk-conf/projectConf";
import * as libs from "./libs";
import { readdirSync, existsSync } from "fs";
import { join } from "path";
import { MODULE_DIR } from "../pk-conf/module";
import { generate } from "../pkt/pkt";
import * as yaml from '../pk-yaml';
import jsonpatch from 'json-patch';
import { loadModuleCommands, loadModuleGenerators } from "./module";

async function main(argv: string[]) {
    const { root, conf } = PkProjectConf.find();
    const yargs = require('yargs')(argv)
        .scriptName("pk")

    const pk = { ...libs, root, conf, generate, yaml, jsonpatch };

    if (conf && root) {
        yargs
            .command(require('./commands/app').default(pk))
            .command(require('./commands/env').default(pk))
            .command(require('./commands/module').default(pk))
            .command(require('./commands/deployment').default(pk))
            ;

        if (conf.data.modules) {
            for (const mod of conf.data.modules) {
                yargs.command({
                    command: `${mod.name} <command>`,
                    description: `module ${mod.name} command`,
                    builder: (yargs: any) => {
                        loadModuleCommands(yargs, root, mod.name, pk);
                        loadModuleGenerators(yargs, root, mod.name, pk);
                    }
                });
            }
        }
        yargs
            .command(require('./commands/test').default(pk))
            .command(require('./commands/config').default(pk))
            .option('d', { description: 'enable stacktrace on error', boolean: true })
            .recommendCommands()
            .demandCommand()
            .strict()
            .help('h')
            .argv
            ;
    } else {
        yargs
            .command(require('./commands/init').default(pk))
            .command(require('./commands/test').default(pk))
            .command(require('./commands/config').default(pk))
            .option('d', { description: 'enable stacktrace on error', boolean: true })
            .recommendCommands()
            .demandCommand()
            .strict()
            .help('h')
            .argv
            ;
    }
}

main(process.argv.slice(2));
