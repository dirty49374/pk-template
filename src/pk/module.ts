import { MODULE_DIR } from '../pk-conf/module';
import { join } from 'path';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { writeObject } from '../pk-writeutil';

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

    const buildOptionsFromInput = (yargs: any, input: any) => {
        if (!input) {
            return;
        }

        yargs.options('dry', { description: 'dry run this command' });
        for (const name of Object.keys(input)) {
            const value = input[name];
            const opt = {
                description: `${name} option`,
                default: value,
            };
            yargs.option(name, opt);
        }
    }

    const buildOptionsFromSchema = (yargs: any, schema: any, input: any) => {
        if (!schema.properties) {
            return;
        }

        yargs.options('dry', { description: 'dry run this command' });
        for (const name of Object.keys(schema.properties)) {
            const prop = schema.properties[name];
            const opt: any = {
                description: prop.description || name,
            };
            if (prop.enum) {
                opt.choices = prop.enum;
            }
            if (schema.required && schema.required.includes(name)) {
                opt.demandOption = true;
            } else if (input[name] == null) {
                if (!Array.isArray(prop.type) || prop.type.indexOf('null') == -1) {
                    opt.demandOption = true;
                }
            } else {
                opt.default = input[name];
            }
            yargs.option(name, opt);
        }
    }

    const buildCommand = (pk: any, dir: string, file: string) => {
        const name = file.substr(0, file.length - 4);
        const pkt = pk.yaml.parseYamlAsPkt(readFileSync(join(dir, file), 'utf8'));
        return {
            command: `gen-${name}`,
            desc: pkt && pkt.schema && pkt.schema.title || name,
            builder: (yargs: any) => pkt.schema
                ? buildOptionsFromSchema(yargs, pkt.schema, pkt.input || {})
                : buildOptionsFromInput(yargs, pkt.input),
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
