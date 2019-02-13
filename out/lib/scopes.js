"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const url_1 = __importDefault(require("url"));
const jslib_1 = __importDefault(require("./jslib"));
const clone = (obj) => JSON.parse(JSON.stringify(obj));
class Scope {
    constructor({ objects, values, uri, parent, config, userdata }) {
        this.objects = objects;
        this.values = values;
        this.uri = uri;
        this.parent = parent;
        this.config = config;
        this.userdata = userdata;
        this.$buildLib = jslib_1.default;
    }
    resolve(path) {
        const p1 = this.config.resolve ? this.config.resolve(path) : path; // resolve @
        const resolved = url_1.default.resolve(this.uri, p1);
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
            $buildLib: jslib_1.default,
        });
        return handler(scope);
    }
}
const scopes = {
    create(values, uri, parent, config, objects, userdata) {
        const scope = new Scope({
            objects: objects ? [...objects] : [],
            values: values ? clone(values) : {},
            uri: uri || '.',
            parent: parent || null,
            config: config || {},
            userdata: userdata || {},
        });
        return scope;
    },
};
exports.default = scopes;
