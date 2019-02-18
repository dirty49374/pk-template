import * as pkyaml from '../pk-yaml';
import chalk from "chalk";
import Diff = require("diff");
import { IObject } from "../common";

function printDiffPart(encolor: any, prefix: string, value: string, print: string) {
    const lines = value.split('\n');
    lines.pop(); // value: "line1\nline2\n"

    for (let i = 0; i < lines.length; ++i) {
        const line = lines[i];
        const enabled = print == 'all' ||
            ((print == 'both' || print == 'begin') && i < 2) ||
            ((print == 'both' || print == 'end') && lines.length - 3 < i);
        if (enabled) {
            console.log(encolor(prefix + line));
        } else if (i == 2) {
            console.log(encolor('  |~~~~~~~~~~~~~~~~~~~~~~~~~~~'));
        }
    }
}

export function diffObject(key: string, prev: string, curr: string) {
    console.log('*', key + ':');

    var diff = Diff.diffLines(prev, curr);
    for (let i = 0; i < diff.length; ++i) {
        const part = diff[i];
        if (part.added) {
            printDiffPart(chalk.green, '  + ', part.value, 'all');
        } else if (part.removed) {
            printDiffPart(chalk.red, '  - ', part.value, 'all');
        } else {
            const print = i == 0
                ? 'end'
                : (i == diff.length - 1 ? 'begin' : 'both');
            printDiffPart(chalk.gray, '  | ', part.value, print);
        }
    }
}

export function diffObjects(prev: IObject[], curr: IObject[]) {
    const prevmap: any = prev.reduce((sum, o) => ({ ...sum, [`${o.metadata.namespace || ''}/${o.metadata.name}/${o.apiVersion}/${o.kind}`]: o }), {});
    const currmap: any = curr.reduce((sum, o) => ({ ...sum, [`${o.metadata.namespace || ''}/${o.metadata.name}/${o.apiVersion}/${o.kind}`]: o }), {});

    let same = true;
    for (const key in prevmap) {
        if (key in currmap) {
            const prevYaml = pkyaml.dumpYaml(prevmap[key]);
            const currYaml = pkyaml.dumpYaml(currmap[key]);
            if (prevYaml !== currYaml) {
                diffObject(key, prevYaml, currYaml);
                same = false;
            }
        } else {
            diffObject(key, pkyaml.dumpYaml(prevmap[key]), '');
            same = false;
        }
    }
    for (const key in currmap) {
        if (key in currmap) {
            continue;
        } else {
            diffObject(key, '', pkyaml.dumpYaml(currmap[key]));
            same = false;
        }
    }
    if (same) {
        console.log(`all ${Object.keys(currmap).length} objects are same !`)
    }
}
