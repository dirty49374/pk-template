const clone = obj => JSON.parse(JSON.stringify(obj));
const scopes = {
    create(values, uri, parent, config, objects) {
        const scope = {
            objects: objects ? [ ...objects ] : [],
            values: values ? clone(values) : {},
            uri: uri || '.',
            parent: parent || null,
            config: config,
            $buildLib: scopes.buildLib,
        };
        return scope;
    },
    open(parent, { uri, objects, values }, handler) {
        const scope = {
            objects: objects || [],
            values: values || clone(parent.values),
            uri: uri || parent.uri,
            config: parent.config,
            parent,
            $buildLib: scopes.buildLib,
        };

        return handler(scope);
    },
    add(scope, object) {
        while (scope) {
            scope.objects.push(object);
            scope = scope.parent;
        }
    },
    buildLib: scope => ({
        add: object => scopes.add(scope, object),
        expand: path => statements.include(scope, { include: path }),
        loadText: path => load.text(scope, url.resolve(scope.uri, path)),
        loadYaml: path => path.toLowerCase().endsWith('.pkt')
            ? jsyaml.load(load.text(scope, path), pktYamlOption)
            : jsyaml.load(load.text(scope, path)),
        loadYamlAll: path => jsyaml.loadAll(load.text(scope, path)),
        loadTemplate: path => load.template(scope, path),
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
    })
};

module.exports = scopes;

