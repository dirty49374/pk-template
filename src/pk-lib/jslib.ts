import path from 'path';
import * as loaders from './loaders';
// const runtimes = require('./runtimes');
import { parseKvps, parseList, pktError } from './utils';
import { IScope } from './types';

const jslib = (scope: IScope) => {
    const lib = {
        // disabled ( causing circular dependency )
        // expand: path => runtimes.statements.include(scope, { include: path }),
        files: (path: string) => loaders.files(scope, scope.resolve(path)),
        loadText: (path: string) => loaders.loadText(scope, scope.resolve(path)),
        loadPkt: (path: string) => loaders.pkt(scope, scope.resolve(path)),
        loadYaml: (path: string) => loaders.yaml(scope, scope.resolve(path)),
        loadYamlAll: (path: string) => loaders.yamlAll(scope, scope.resolve(path)),
        loadTemplate: (path: string) => loaders.template(scope, scope.resolve(path)),
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
        annotation: (object: any, name: string | null) => {
            if (name === null) {
                name = object as string;
                object = scope.object;
            }
            if (!object) return undefined;
            if (!object.metadata) return undefined;
            if (!object.metadata.annotations) return undefined;
            return object.metadata.annotations[name];
        },
        setannotation: (object: any, name: string, value: string | null) => {
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
        arraify: (value: any) => Array.isArray(value) ? value : [value],
        parseKvps,
        parseList,
        toWords: (value: string) => value.split(/\s+/).filter(p => p.length !== 0),
        toNumbers: (value: string) => lib.toWords(value).map(p => Number(p)),
        toList: (o: any, cb: any) => Object.keys(o).map(k => cb(k, o[k])),
        styleMap: (list: any[]) => list.reduce((sum: any, kv: any) => { sum[kv.k] = kv.v; return sum; }, {}),
    };
    return lib;
};

export default jslib;
