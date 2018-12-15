const jslib = require('./jslib');

const clone = obj => JSON.parse(JSON.stringify(obj));
const scopes = {
    create(values, uri, parent, config, objects, userdata) {
        const scope = {
            objects: objects ? [ ...objects ] : [],
            values: values ? clone(values) : {},
            uri: uri || '.',
            parent: parent || null,
            config: config,
            userdata: userdata,
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
            userdata: parent.userdata,
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
    buildLib: jslib
};

module.exports = scopes;

