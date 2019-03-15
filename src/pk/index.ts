import { PkProjectConf } from "../pk-conf/projectConf";
import * as libs from "./libs";
import { readdirSync, existsSync } from "fs";
import { join } from "path";
import { MODULE_DIR } from "../pk-conf/module";

function loadModuleCommands(yargs: any, root: string, name: string) {
    const mcd = join(root, MODULE_DIR, name, 'commands');
    if (existsSync(mcd)) {
        const commands = readdirSync(mcd)
            .filter(file => file.endsWith('.js'))
            .map(file => require(`${mcd}/${file}`));

        if (commands.length != 0) {
            yargs.command({
                command: `${name} <command>`,
                desc: `module ${name} commands`,
                builder: (yargs: any) => commands.forEach(c => yargs.command(c)),
            });
        }
    }

}
async function main(argv: string[]) {
    const { root, conf } = PkProjectConf.find();
    const yargs = require('yargs')(argv)
        .scriptName("pk")
        .option('d', { description: 'enable stacktrace on error', boolean: true });

    if (conf && root) {
        yargs
            .middleware((argv: any) => {
                argv.$pk = { ...libs, root, conf };
            })
            .command(require('./commands/app').default)
            .command(require('./commands/env').default)
            .command(require('./commands/module').default)
            .command(require('./commands/deployment').default)
            ;

        if (conf.data.modules) {
            for (const mod of conf.data.modules) {
                loadModuleCommands(yargs, root, mod.name);
            }
        }
        yargs
            .command(require('./commands/test').default)
            .command(require('./commands/config').default)
            .recommendCommands()
            .demandCommand()
            .strict()
            .help('h')
            .argv
            ;
    } else {
        yargs
            .command(require('./commands/init').default)
            .command(require('./commands/test').default)
            .command(require('./commands/config').default)
            .recommendCommands()
            .demandCommand()
            .strict()
            .help('h')
            .argv
            ;
    }
}

main(process.argv.slice(2));
