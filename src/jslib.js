const path = require('path');
const loaders = require('./loaders');

const jslib = scope => ({
    add: object => scopes.add(scope, object),
    expand: path => statements.include(scope, { include: path }),
    globs: (path, fromCwd) => loaders.globs(scope, path, fromCwd),
    files: (path, fromCwd) => loaders.files(scope, path, fromCwd),
    loadText: (path, fromCwd) => loaders.text(scope, path, fromCwd),
    loadYaml: (path, fromCwd) => path.toLowerCase().endsWith('.pkt')
        ? jsyaml.load(load.text(scope, path, fromCwd), pktYamlOption)
        : jsyaml.load(load.text(scope, path, fromCwd)),
    loadYamlAll: (path, fromCwd) => jsyaml.loadAll(load.text(scope, path, fromCwd)),
    loadTemplate: (path, fromCwd) => load.template(scope, path, fromCwd),
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
});

module.exports = jslib;
