import { IPkt } from "../pk-template/types";

export const buildOptionsFromProperties = (yargs: any, properties: any) => {
    if (!properties) {
        return yargs;
    }
    console.log('from prop', properties);
    for (const name of Object.keys(properties)) {
        const value = properties[name];
        const opt = {
            description: `${name} option`,
            default: value,
        };
        console.log('zzz')
        yargs.option(name, opt);
    }
    return yargs;
}

export const buildOptionsFromSchema = (yargs: any, schema: any, properties: any) => {
    if (!schema.properties) {
        return yargs;
    }

    for (const name of Object.keys(properties)) {
        const prop = schema.properties[name];
        if (prop) {
            const opt: any = {
                description: prop.description || name,
            };
            if (prop.enum) {
                opt.choices = prop.enum;
            }
            if (prop.type) {
                opt.type = prop.type;
            }
            if (schema.required && schema.required.includes(name)) {
                opt.demandOption = true;
            } else if (properties[name] == null) {
                if (!Array.isArray(prop.type) || prop.type.indexOf('null') == -1) {
                    opt.demandOption = true;
                }
            } else {
                opt.default = properties[name];
            }

            yargs.option(name, opt);
        } else {
            yargs.option(name, { 'description': `${name} option`, default: properties[name] });
        }
    }
    return yargs;
}

export const bindYargsOption = (yargs: any, pkt: IPkt) => {
    return pkt.schema
        ? buildOptionsFromSchema(yargs, pkt.schema, pkt.properties || pkt.input || {})
        : buildOptionsFromProperties(yargs, pkt.properties || pkt.input);
}

export const buildCommandDescription = (pkt: IPkt) => {
    let desc = '';
    if (pkt.schema) {
        if (pkt.schema.title) {
            desc += `${pkt.schema.title}`;
        }
        if (pkt.schema.description) {
            desc += `\n\n${pkt.schema.description}`;
        }
    }
    return desc;
}
