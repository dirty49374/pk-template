import fs from 'fs';
import { IPkz } from "../pk-template/types";
import { IObject } from "../common";
import { PkzDeserializer } from './deserializer';
import { PkzBuilder } from './builder';
import { IPktArgs } from '../pkt/args';
import { PkzSerializer } from './serializer';
import { PkzApplier } from './applier';
import { IProgressOptions } from '../pk-commands/types';
import { PkzUninstaller } from './uninstaller';
import { IPkzApplierOption } from './options';

export const load = (path: string): IPkz => {
    const text = fs.readFileSync(`${path}.pkz`, 'utf8');
    return new PkzDeserializer().deserialize(path, text);
}

export const save = (pkz: IPkz) => {
    const yaml = new PkzSerializer().serialize(pkz);
    fs.writeFileSync(pkz.name + ".pkz", yaml, 'utf8');
}

export const build = (packageName: string, contextName: string, args: IPktArgs, objects: IObject[]): IPkz => {
    return new PkzBuilder().build(packageName, contextName, args, objects);
}

export const deploy = async (pkz: IPkz, option: IPkzApplierOption) => {
    return await new PkzApplier(option, pkz).apply();
}

export const uninstall = async (packageName: string, contextName: string, option: IPkzApplierOption) => {
    return await new PkzUninstaller(packageName, contextName, option).uninstall();
}

export const exists = (pkz: IPkz): boolean => {
    return fs.existsSync(`${pkz.name}.pkz`);
}
