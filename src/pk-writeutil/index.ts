import { IObject } from '../common';
import { dumpYaml, parseYaml, dumpYamlAll, parseYamlAll } from '../pk-yaml';
import { readFileSync, writeFileSync } from 'fs';
import jsonpatch from 'json-patch';

const handlers: any = {
    patch: (prev: any, o: any) => {
        if (Array.isArray(o.patch)) {
            for (const p of o.patch) {
                jsonpatch.apply(prev, p);
            }
        } else {
            jsonpatch.apply(prev, o.patch);
        }
        return prev;
    },
    text: (o: any) => {
        if ('write' in o) {
            writeFileSync(o.file, o.write, 'utf8');
        }
    },
    json: (o: any) => {
        if ('write' in o) {
            writeFileSync(o.file, JSON.stringify(o.write, null, o.indent ? o.indent : 0), 'utf8');
        }
        if (o.patch) {
            const prev = parseYaml(readFileSync(o.file, 'utf8'));
            const patched = handlers.patch(prev, o);
            writeFileSync(o.file, JSON.stringify(patched, null, o.indent ? o.indent : 0), 'utf8');
        }
        if (o.func) {
            const prev = parseYaml(readFileSync(o.file, 'utf8'));
            o.func(prev);
            writeFileSync(o.file, JSON.stringify(prev, null, o.indent ? o.indent : 0), 'utf8');
        }
    },
    yaml: (o: any) => {
        if ('write' in o) {
            writeFileSync(o.file, dumpYaml(o.write), 'utf8');
        }
        if (o.patch) {
            const prev = parseYaml(readFileSync(o.file, 'utf8'));
            const patched = handlers.patch(prev, o);
            writeFileSync(o.file, dumpYaml(patched), 'utf8');
        }
        if (o.func) {
            const prev = parseYaml(readFileSync(o.file, 'utf8'));
            o.func(prev);
            writeFileSync(o.file, dumpYaml(prev), 'utf8');
        }
    },
    yamlAll: (o: any) => {
        if ('write' in o) {
            writeFileSync(o.file, dumpYamlAll(o.write), 'utf8');
        }
        if (o.patch) {
            const prev = parseYamlAll(readFileSync(o.file, 'utf8'));
            const patched = handlers.patch(prev, o);
            writeFileSync(o.file, dumpYamlAll(patched), 'utf8');
        }
        if (o.func) {
            const prev = parseYamlAll(readFileSync(o.file, 'utf8'));
            o.func(prev);
            writeFileSync(o.file, dumpYamlAll(prev), 'utf8');
        }
    }
}

export const writeObject = (objects: any[]) => {
    for (const o of objects) {
        handlers[o.type](o);
    }
}
