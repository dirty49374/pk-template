import path from 'path';
import { parseKvps, parseList, pktError, sha256, repository, repositoryPath } from './utils';
import { IScope } from './types';
import { log } from './logger';
import { createHash } from 'crypto';
import { dumpYamlSortedKey, parseYaml, parseYamlAll, dumpYaml, dumpYamlAll } from '../pk-yaml';
import { execSync } from 'child_process';

let repoCache: string | null = null;
const repoPathCache: any = {};

const jslib = (scope: IScope) => {
  const lib = {
    indent: () => scope.trace ? ''.padEnd(scope.trace.depth() * 2) : '',
    envVar: (name: string) => process.env[name],
    log: (...msg: any[]) => log(...msg),
    last: () => scope.objects.length == 0 ? undefined : scope.objects[scope.objects.length - 1],
    sha256: (obj: any, len?: number) => sha256(obj, len),
    repository: (ref?: string) => repoCache || (repoCache = repository(ref)),
    repositoryPath: (path: string) => repoPathCache[path] || (repoPathCache[path] = repositoryPath(path)),
    files: (path: string) => scope.listFiles(path).data,
    loadText: (path: string) => scope.loadText(path).data,
    loadPkt: (path: string) => scope.loadPkt(path).data,
    loadYaml: (path: string) => scope.loadYaml(path).data,
    loadYamlAll: (path: string) => scope.loadYamlAll(path).data,
    loadTemplate: (path: string) => scope.loadTemplate(path).data,
    basename: (p: string) => path.basename(p),
    label: (object: any | string, name: string | null) => {
      if (name === null) {
        name = object as string;
        object = scope.object
      }
      if (!object) return undefined;
      if (!object.metadata) return undefined;
      if (!object.metadata.labels) return undefined;
      return object.metadata.labels[name];
    },
    base64encode: (txt: string) => Buffer.from(txt).toString('base64'),
    base64decode: (txt: string) => Buffer.from(txt, 'base64').toString('utf8'),
    setlabel: (object: any, name: string, value: string) => {
      if (typeof object === 'string') {
        value = name;
        name = object;
        object = scope.object;
      }
      if (!object) throw pktError(scope, new Error('cannot set label'), 'object is empty');
      if (!object.metadata) object.metadata = {};
      if (!object.metadata.labels) object.metadata.labels = {};
      object.metadata.labels[name] = value;
    },
    annotation: (object: any, name: string | undefined) => {
      if (name == null) {
        name = object as string;
        object = scope.object;
      }
      if (!object) return undefined;
      if (!object.metadata) return undefined;
      if (!object.metadata.annotations) return undefined;
      return object.metadata.annotations[name];
    },
    setannotation: (object: any, name: string, value: string | undefined) => {
      if (typeof object === 'string') {
        value = name
        name = object
        object = scope.object
      }
      if (!object) throw pktError(scope, new Error('cannot set annotation'), 'object is empty');
      if (!object.metadata) object.metadata = {};
      if (!object.metadata.annotations) object.metadata.annotations = {};
      object.metadata.annotations[name] = value;
    },
    set: (node: any, path: string, value: any) => {
      const _setValue = (node: any, pathes: string[], value: any) => {
        if (true) {
          const key = pathes[0];
          if (pathes.length == 1) {
            node[key] = value;
          } else {
            const child = key in node ? node[key] : (node[key] = {});
            pathes.shift();
            _setValue(child, pathes, value);
          }
        }
      }
      _setValue(node, path.split('.'), value);
    },
    add: (object: any) => scope.add(object),
    arraify: (value: any) => Array.isArray(value) ? value : [value],
    parseKvps,
    parseList,
    parseYaml: (yaml: string) => parseYaml(yaml, scope.uri),
    parseYamlAll: (yaml: string) => parseYamlAll(yaml, scope.uri),
    dumpYaml: (obj: any) => dumpYaml(obj),
    dumpYamlAll: (obj: any[]) => dumpYamlAll(obj),
    toWords: (value: string) => value.split(/\s+/).filter(p => p.length !== 0),
    toNumbers: (value: string) => lib.toWords(value).map(p => Number(p)),
    toList: (o: any, cb: any) => Object.keys(o).map(k => cb(k, o[k])),
    styleMap: (list: any[]) => list.reduce((sum: any, kv: any) => { sum[kv.k] = kv.v; return sum; }, {}),
  };
  return lib;
};

export default jslib;
