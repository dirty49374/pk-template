"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const loaders_1 = __importDefault(require("./loaders"));
// const runtimes = require('./runtimes');
const utils_1 = require("./utils");
const jslib = (scope) => ({
    // disabled ( causing circular dependency )
    // expand: path => runtimes.statements.include(scope, { include: path }),
    globs: (path) => loaders_1.default.globs(scope, scope.resolve(path)),
    files: (path) => loaders_1.default.files(scope, scope.resolve(path)),
    loadText: (path) => loaders_1.default.text(scope, scope.resolve(path)),
    loadPkt: (path) => loaders_1.default.pkt(scope, scope.resolve(path)),
    loadYaml: (path) => loaders_1.default.yaml(scope, scope.resolve(path)),
    loadYamlAll: (path) => loaders_1.default.yamlAll(scope, scope.resolve(path)),
    loadTemplate: (path) => loaders_1.default.template(scope, scope.resolve(path)),
    basename: (p) => path_1.default.basename(p),
    label: (object, name) => {
        if (name === null) {
            name = object;
            object = scope.object;
        }
        if (!object)
            return undefined;
        if (!object.metadata)
            return undefined;
        if (!object.metadata.labels)
            return undefined;
        return object.metadata.labels[name];
    },
    setlabel: (object, name, value) => {
        if (typeof object === 'string') {
            value = name;
            name = object;
            object = scope.object;
        }
        if (!object)
            throw utils_1.pktError(scope, new Error('cannot set label'), 'object is empty');
        if (!object.metadata)
            object.metadata = {};
        if (!object.metadata.labels)
            object.metadata.labels = {};
        object.metadata.labels[name] = value;
    },
    annotation: (object, name) => {
        if (name === null) {
            name = object;
            object = scope.object;
        }
        if (!object)
            return undefined;
        if (!object.metadata)
            return undefined;
        if (!object.metadata.annotations)
            return undefined;
        return object.metadata.annotations[name];
    },
    setannotation: (object, name, value) => {
        if (typeof object === 'string') {
            value = name;
            name = object;
            object = scope.object;
        }
        if (!object)
            throw utils_1.pktError(scope, new Error('cannot set annotation'), 'object is empty');
        if (!object.metadata)
            object.metadata = {};
        if (!object.metadata.annotations)
            object.metadata.annotations = {};
        object.metadata.annotations[name] = value;
    },
    arraify: (value) => Array.isArray(value) ? value : [value],
    parseKvps: utils_1.parseKvps,
    parseList: utils_1.parseList,
});
exports.default = jslib;
