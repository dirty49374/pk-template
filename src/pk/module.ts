import { MODULE_DIR } from '../pk-conf/module';
import { join } from 'path';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { writeObject } from '../pk-writeutil';
import { bindYargsOption, buildCommandDescription } from '../pk-yargs/bindOption';
import { IPkt } from '../pk-template/types';
import { IPkCommandInfo } from './types';

export function loadModuleCommands(yargs: any, root: string, name: string, pk: IPkCommandInfo) {
    const mcd = join(root, MODULE_DIR, name, 'commands');
    if (existsSync(mcd)) {
        const commands = readdirSync(mcd)
            .filter(file => file.endsWith('.js'))
            .map(file => require(`${mcd}/${file}`));

        commands.forEach(cmdgen => yargs.command(cmdgen(pk)));
    }
}

export function loadModuleGenerators(yargs: any, root: string, name: string, pk: IPkCommandInfo) {

    const buildCommand = (pk: any, dir: string, file: string) => {
        const name = file.substr(0, file.length - 4);
        const pkt = pk.compilePkt(readFileSync(join(dir, file), 'utf8'), file);
        return {
            command: `gen-${name}`,
            desc: buildCommandDescription(pkt.header),
            builder: (yargs: any) => bindYargsOption(yargs, pkt.header)
                .options('dry', { description: 'dry run this command' }),
            handler: async (argv: any) => {
                await pk.tryCatch(async () => {
                    const result = pk.generate({
                        file: join(dir, file),
                        values: argv,
                    });
                    if (argv.dry) {
                        console.log(pk.yaml.dumpYamlAll(result));
                    } else {
                        const patches = result.map((o: any) => ({
                            type: 'yamlAll',
                            file: 'app.pkt',
                            func: (obj: any) => {
                                const idx = obj.findIndex((r: any) => r['/comment'] == '---');
                                if (idx == -1) {
                                    obj.push(o);
                                } else {
                                    obj.splice(idx, 0, o);
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
