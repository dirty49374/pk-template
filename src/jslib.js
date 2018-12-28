const path = require('path');
const scopes = require('./scopes');
const loaders = require('./loaders');

const jslib = scope => ({
    add: object => {
        while (scope) {
            scope.objects.push(object);
            scope = scope.parent;
        }
    },
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
    parseKvps: (value) => {
        const kvps = {};
        value.split(';')
            .map(kvp => kvp.trim())
            .forEach(kvp => {
                const pair = kvp.split('=');
                kvps[pair[0].trim()] = pair[1].trim();
            });
        return kvps;
    }
});

module.exports = jslib;
