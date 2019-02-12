const path = require('path');
const loaders = require('./loaders');
// const runtimes = require('./runtimes');
const { parseKvps, parseList } = require('./utils');

const jslib = scope => ({
    // disabled ( causing circular dependency )
    // expand: path => runtimes.statements.include(scope, { include: path }),
    globs: (path) => loaders.globs(scope, scope.resolve(path)),
    files: (path) => loaders.files(scope, scope.resolve(path)),
    loadText: (path) => loaders.text(scope, scope.resolve(path)),
    loadPkt: (path) => loaders.pkt(scope, scope.resolve(path)),
    loadYaml: (path) => loaders.yaml(scope, scope.resolve(path)),
    loadYamlAll: (path) => loaders.yamlAll(scope, scope.resolve(path)),
    loadTemplate: (path) => loaders.template(scope, scope.resolve(path)),
    basename: p => path.basename(p),
    label: (object, name) => {
        if (typeof object === 'string') {
            name = object
            object = scope.object
        }
        if (!object) return undefined;
        if (!object.metadata) return undefined;
        if (!object.metadata.labels) return undefined;
        return object.metadata.labels[name];
    },
    setlabel: (object, name, value) => {
        if (typeof object === 'string') {
            value = name
            name = object
            object = scope.object
        }
        if (!object) throw base.pktError(scope, 'cannot set label', 'object is empty');
        if (!object.metadata) object.metadata = {};
        if (!object.metadata.labels) object.metadata.labels = {};
        object.metadata.labels[name] = value;
    },
    annotation: (object, name) => {
        if (typeof object === 'string') {
            name = object
            object = scope.object
        }
        if (!object) return undefined;
        if (!object.metadata) return undefined;
        if (!object.metadata.annotations) return undefined;
        return object.metadata.annotations[name];
    },
    setannotation: (object, name, value) => {
        if (typeof object === 'string') {
            value = name
            name = object
            object = scope.object
        }
        if (!object) throw base.pktError(scope, 'cannot set annotation', 'object is empty');
        if (!object.metadata) object.metadata = {};
        if (!object.metadata.annotations) object.metadata.annotations = {};
        object.metadata.annotations[name] = value;
    },
    arraify: value => Array.isArray(value) ? value : [ value ],
    parseKvps,
    parseList,
});

module.exports = jslib;
