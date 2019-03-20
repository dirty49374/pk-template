import { MODULE_DIR } from '../pk-conf/module';
import { join } from 'path';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { writeObject } from '../pk-writeutil';
import { bindYargsOption, buildCommandDescription } from '../pk-yargs/bindOption';

export function loadModuleCommands(yargs: any, root: string, name: string, pk: any) {
    const mcd = join(root, MODULE_DIR, name, 'commands');
    if (existsSync(mcd)) {
        const commands = readdirSync(mcd)
            .filter(file => file.endsWith('.js'))
            .map(file => require(`${mcd}/${file}`));

        commands.forEach(cmdgen => yargs.command(cmdgen(pk)));
    }
}

export function loadModuleGenerators(yargs: any, root: string, name: string, pk: any) {

    const buildCommand = (pk: any, dir: string, file: string) => {
        const name = file.substr(0, file.length - 4);
        const pkt = pk.yaml.parseYamlAsPkt(readFileSync(join(dir, file), 'utf8'));
        return {
            command: `gen-${name}`,
            desc: buildCommandDescription(pkt),
            builder: (yargs: any) => bindYargsOption(yargs, pkt)
                .options('dry', { description: 'dry run this command' }),
            handler: async (argv: any) => {
                await pk.tryCatch(async () => {
                    const result = pk.generate({
                        files: [join(dir, file)],
                        values: argv,
                    });
                    if (argv.dry) {
                        console.log(pk.yaml.dumpYamlAll(result));
                    } else {
                        const patches = result.map((o: any) => ({
                            type: 'yaml',
                            file: 'app.pkt',
                            patch: {
                                op: 'add',
                                path: '/routine/-',
                                value: {
                                    add: o,
                                }
                            }
                        }));
                        writeObject(patches);
                    }
                }, !!argv.d);
            }
        }
    }

    const mgd = join(root, MODULE_DIR, name, 'generators');
    if (existsSync(mgd)) {
        const pkts = readdirSync(mgd)
            .filter(file => file.endsWith('.pkt'));
        pkts.forEach(fn => yargs.command(buildCommand(pk, mgd, fn)));
    }
}
