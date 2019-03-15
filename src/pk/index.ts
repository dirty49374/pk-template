import { PkConf } from "../pk-conf/conf";
import * as libs from "./libs";
import { readdirSync, existsSync } from "fs";

function loadModuleCommands(yargs: any, name: string) {
    const cwd = process.cwd();
    const mcd = `${cwd}/pk_modules/${name}/commands/`;
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
    const { dir, conf } = PkConf.find();
    const yargs = require('yargs')(argv)
        .scriptName("pk");


    if (conf && dir) {
        yargs
            .middleware((argv: any) => {
                argv.$pk = {
                    ...libs,
                    root: dir,
                    conf,
                };
            })
            .command(require('./commands/app').default)
            .command(require('./commands/env').default)
            .command(require('./commands/module').default)
            .command(require('./commands/deployment').default)
            ;

        process.chdir(dir);
        if (conf.modules) {
            for (const mod of conf.modules) {
                loadModuleCommands(yargs, mod.name);
            }
        }
        yargs
            .command(require('./commands/init').default)
            .command(require('./commands/test').default)
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
            .recommendCommands()
            .demandCommand()
            .strict()
            .help('h')
            .argv
            ;
    }
}

main(process.argv.slice(2));
