const url = require('url');
const jslib = require('./jslib');

const clone = obj => JSON.parse(JSON.stringify(obj));
class Scope {
    constructor({ objects, values, uri, parent, config, userdata }) {
        this.objects = objects;
        this.values = values;
        this.uri = uri;
        this.parent = parent;
        this.config = config;
        this.userdata = userdata;
        this.$buildLib = jslib;
    }

    resolve(path) {
        const p1 = this.config.resolve ? this.config.resolve(path) : path; // resolve @
        const resolved = url.resolve(this.uri, p1);
        return resolved || '.';
    }

    add(object) {
        let scope = this;
        while (scope) {
            scope.objects.push(object);
            scope = scope.parent;
        }
    }

    child({ uri, objects, values }, handler) {
        const scope = new Scope({
            objects: objects || [],
            values: values || clone(this.values),
            uri: uri || this.uri,
            config: this.config,
            parent: this,
            userdata: this.userdata,
            $buildLib: jslib,
        });

        return handler(scope);
    }
}

const scopes = {
    create(values, uri, parent, config, objects, userdata) {
        const scope = new Scope({
            objects: objects ? [ ...objects ] : [],
            values: values ? clone(values) : {},
            uri: uri || '.',
            parent: parent || null,
            config: config || {},
            userdata: userdata || {},
        });
        return scope;
    },
};

module.exports = scopes;
