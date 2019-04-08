import * as pkyaml from '../pk-yaml';
import chalk from "chalk";
import Diff = require("diff");
import { IObject } from "../common";

function printDiffPart(encolor: any, prefix: string, value: string, print: string, indent: string = '') {
  const lines = value.split('\n');
  lines.pop(); // value: "line1\nline2\n"

  for (let i = 0; i < lines.length; ++i) {
    const line = lines[i];
    const enabled = print == 'all' ||
      ((print == 'both' || print == 'begin') && i < 2) ||
      ((print == 'both' || print == 'end') && lines.length - 3 < i);
    if (enabled) {
      console.log(encolor(indent + prefix + line));
    } else if (i == 2) {
      console.log(encolor(indent + '  |~~~~~~~~~~~~~~~~~~~~~~~~~~~'));
    }
  }
}

export function diffObject(key: string, prev: string, curr: string, indent: string = '') {
  console.log(indent + '-', key + ':');

  var diff = Diff.diffLines(prev, curr);
  for (let i = 0; i < diff.length; ++i) {
    const part = diff[i];
    if (part.added) {
      printDiffPart(chalk.green, '  + ', part.value, 'all', indent);
    } else if (part.removed) {
      printDiffPart(chalk.red, '  - ', part.value, 'all', indent);
    } else {
      const print = i == 0
        ? 'end'
        : (i == diff.length - 1 ? 'begin' : 'both');
      printDiffPart(chalk.gray, '  | ', part.value, print, indent);
    }
  }
}

export function diffObjects(prev: IObject[], curr: IObject[], indent: string = '', header: string = '') {
  const keyMapreducer = (sum: IObject, o: IObject) => ({ ...sum, [`${o.metadata.namespace || ''}/${o.metadata.name}/${o.apiVersion}/${o.kind}`]: o });
  const nonPkzFilter = (o: IObject) =>
    (o.kind !== 'ConfigMap' || o.metadata.namespace !== 'pk-deployments') &&
    (o.kind !== 'Namespace' || o.metadata.name !== 'pk-deployments');
  const prevmap: any = prev.filter(nonPkzFilter).reduce(keyMapreducer, {});
  const currmap: any = curr.filter(nonPkzFilter).reduce(keyMapreducer, {});

  let same = true;
  for (const key in prevmap) {
    if (key in currmap) {
      const prevYaml = pkyaml.dumpYamlSortedKey(prevmap[key]);
      const currYaml = pkyaml.dumpYamlSortedKey(currmap[key]);
      if (prevYaml !== currYaml) {
        if (header) {
          console.log(header);
          header = '';
        }
        diffObject(key, prevYaml, currYaml, indent);
        same = false;
      }
    } else {
      if (header) {
        console.log(header);
        header = '';
      }
      console.log(`${indent}*`, key + ':');
      console.log(chalk.red(`${indent}  - `, 'deleted'));
      //diffObject(key, pkyaml.dumpYamlSortedKey(prevmap[key]), '');
      same = false;
    }
  }
  for (const key in currmap) {
    if (key in prevmap) {
      continue;
    } else {
      if (header) {
        console.log(header);
        header = '';
      }
      console.log(`${indent}*`, key + ':');
      console.log(chalk.green(`${indent}  + `, 'created'));
      // diffObject(key, '', pkyaml.dumpYamlSortedKey(currmap[key]));
      same = false;
    }
  }
  return same;
}
