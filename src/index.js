const _ = require('underscore');
const fs = require("fs");
const jsonpatch = require("json-patch");
const jsonpath = require("jsonpath");
const url = require('url');
const path = require('path');
const jsyaml = require('js-yaml');
const syncRequest = require('sync-request');
const coffeeScript = require('coffeescript');
const liveScript = require('livescript');
const Ajv = require('ajv');
const ajv = new Ajv({allErrors: true});

_.templateSettings = {
    interpolate: /\<\<\<\=(.+?)\>\>\>/g,
    evaluate: /\<\<\<\_(.+?)\>\>\>/g,
};

class JsCode {
    constructor(code) {
        this.code = code;
    }
}

const createCustomTag = (name, compile) => {
    return new jsyaml.Type(`!${name}`, {
        kind: 'scalar',
        resolve: data =>
                typeof data === 'string' ||
                typeof data === number ||
                typeof data === null,
        construct: data => new JsCode(compile ? compile(data) : data),
        instanceOf: JsCode,
        represent: jsCode => `!${name} ${jsCode.code}`
    });
}

const PKT_SCHEMA = jsyaml.Schema.create([
    createCustomTag('cs', data => coffeeScript.compile(data, { bare: true })),
    //createCustomTag('coffee', data => coffeeScript.compile(data, { bare: true })),
    createCustomTag('ls', data => liveScript.compile(data, { bare: true })),
    createCustomTag('js', data => data),
]);

const pktYamlOption = { schema: PKT_SCHEMA };

const pktError = (scope, error, message) => {
    error.summary = message;
    error.uri = scope.uri;
    return error;
}

const compileSelector = src => {
    const nv = src.split('=');

    if (nv.length > 1) {
        const lname = nv[0];
        const value = nv[1];
        if (lname[0] === '!') {
            const aname = lname.substring(1)
            return object =>
                object.metadata &&
                object.metadata.annotations &&
                (
                    value === '*'
                        ? aname in object.metadata.annotations
                        : object.metadata.annotations[aname] === value
                );
        }
        return object =>
            object.metadata &&
            object.metadata.labels &&
            (
                value === '*'
                    ? lname in object.metadata.labels
                    : object.metadata.labels[lname] === value
            );
    } else if (src[0] === '.') {
        const name = src.substr(1);
        return object =>
            object.metadata &&
            object.metadata.name == name;
    } else {
        return object => object.kind === src;
    }
}

const compileSelectorLine = src => {
    const selectors = src.split(/\s+/)
        .map(compileSelector);
    return object => selectors.every(pred => pred(object));
}

const compileSelectors = src => {
    if (typeof src === 'string')
        src = [ src ];
    const selectors = src.map(compileSelectorLine);
    return object => selectors.some(pred => pred(object));
}

const clone = obj => JSON.parse(JSON.stringify(obj));
const scopes = {
    create(values, uri, parent, config, objects) {
        const scope = {
            objects: objects ? [ ...objects ] : [],
            values: values ? clone(values) : {},
            uri: uri || '.',
            parent: parent || null,
            config: config
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
        };

        return handler(scope);
    },
    add(scope, object) {
        while (scope) {
            scope.objects.push(object);
            scope = scope.parent;
        }
    },
}

const load = {
    text(scope, uri) {
        try {
            uri = scope ? scope.config.resolve(uri) : uri; // resolve @
            let parsed = url.parse(uri);

            const supportedProtocols = [ 'http:', 'https:' ];
            const isAbsoluteUrl = supportedProtocols.some(protocol => protocol == parsed.protocol);

            return isAbsoluteUrl
                ? syncRequest('GET', uri).getBody('utf8')
                : fs.readFileSync(uri, 'utf8');
        } catch (e) {
            throw pktError(scope, e, `failed to load ${uri}`);
        }
    },
    yaml(scope, uri) {
        const text = load.text(scope, uri);
        try {
            return jsyaml.load(text, pktYamlOption);
        } catch (e) {
            throw pktError(scope, e, `failed to parse yaml ${uri}`);
        }
    },
    template(scope, uri) {
        const text = load.text(scope, uri);
        try {
            return _.template(text);
        } catch (e) {
            throw pktError(scope, e, `failed to parse template ${uri}`);
        }
    }
}

const lib = scope => ({
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
        if (!object) throw pktError(scope, 'cannot set label', 'object is empty');
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
        if (!object) throw pktError(scope, 'cannot set annotation', 'object is empty');
        if (!object.metadata) object.metadata = {};
        if (!object.metadata.annotations) object.metadata.annotations = {};
        object.metadata.annotations[name] = value;
    },
    arraify: value => Array.isArray(value) ? value : [ value ],
});

const evaluate = {
    eval(scope, script) {
        const $ = {
            ...scope,
            ...lib(scope)
        };
        with (scope.values) {
            return eval(script);
        }
    },
    deep(scope, object) {
        if (object instanceof JsCode) {
            return evaluate.javsScript(scope, object.code);
        }

        if (Array.isArray(object)) {
            return object.map(item => evaluate.deep(scope, item));
        }

        if (typeof object === 'object') {
            const clone = {};
            Object.keys(object)
                .forEach(key => clone[key] = evaluate.deep(scope, object[key]));
            return clone;
        }
        return object;
    },
    javsScript(scope, javascript) {
        return evaluate.eval(scope, javascript);
    },
    coffeeScript(scope, coffeescript) {
        const javascript = coffeeScript.compile(coffeescript, { bare: true });
        return evaluate.javsScript(scope, javascript);
    },
    liveScript(scope, livescript) {
        const javascript = liveScript.compile(livescript, { bare: true });
        return evaluate.javsScript(scope, javascript);
    },
    script(scope, script) {
        try {
            if (script instanceof JsCode)
                return evaluate.javsScript(scope, script.code);
            return evaluate.liveScript(scope, script);
        } catch (e) {
            throw pktError(scope, e, `failed to evalute`);
        }
    },
    template(scope, text) {
        try {
            const tpl = _.template(text);
            const yaml = tpl({
                ...scope.values,
                $: scope
            });
            const objects = jsyaml.loadAll(yaml, PKT_SCHEMA);
            return objects;
        } catch (e) {
            throw pktError(scope, e, 'failed to parse template');
        }
    },
}

const statements = {
    break(scope, statement) {
        if (!statement.break) return false;
        return true;
    },
    script(scope, statement) {
        if (!statement.script) return false;
        evaluate.script(scope, statement.script, {});
        return true;
    },
    each(scope, statement) {
        if (!statement.each) return false;
        scope.objects.forEach(o => {
            scope.object = o;
            evaluate.script(scope, statement.each, {});
        });
        delete scope.object;
        return true;
    },    
    assign(scope, statement) {
        if (!statement.assign) return false;
        scope.values = {
            ...scope.values,
            ...evaluate.deep(scope, statement.assign || {}),
        };
        return true;
    },
    add(scope, statement) {
        if (!statement.add) return false;
        const object = evaluate.deep(scope, statement.add);
        scopes.add(scope, object);
        return true;
    },
    include(scope, statement) {
        if (!statement.include) return false;
        const uri = url.resolve(scope.uri, statement.include);

        if (uri.toLowerCase().endsWith(".pkt")) {
            const file = load.yaml(scope, uri);
            engine.run(file, scope, uri);
        } else {
            const tpl = load.text(scope, uri);
            const objects = evaluate.template(scope, tpl);
            objects.forEach(object => scopes.add(scope, object));
        }
        return true;
    },
    jsonpath(scope, statement) {
        if (!statement.jsonpath) return false;
        scope.objects.forEach(o => {
            const nodes = jsonpath.nodes(o, statement.jsonpath.query);
            nodes.forEach(node => {
                scopes.open(scope, {}, cscope => {
                    cscope.object = o;
                    cscope.path = node.path;
                    cscope.value = node.value;

                    if (statement.jsonpath.apply) {
                        const value = evaluate.deep(cscope, statement.jsonpath.apply);
                        jsonpath.apply(o, jsonpath.stringify(node.path), () => value);
                    } else if (statement.jsonpath.exec) {
                        evaluate.script(cscope, statement.jsonpath.exec);
                    }
                });
            })
        });
    },
    apply(scope, statement) {
        if (!statement.apply) return false;
        const uri = url.resolve(scope.uri, statement.apply);

        if (uri.toLowerCase().endsWith(".pkt")) {
            const file = load.yaml(scope, uri);
            engine.run(file, scope, uri, true);
        } else {
            const tpl = load.text(scope, uri);
            const objects = evaluate.template(scope, tpl);
            scope.objects.push(...objects);
        }
        return true;
    },
    patch(scope, statement) {
        if (!statement.patch) return false;
        const patch = Array.isArray(statement.patch) ? statement.patch : [ statement.patch ];
        scope.objects.forEach(o => {
            const p = evaluate.deep(scope, patch);
            jsonpatch.apply(o, p);
        });
        delete scope.object;
        return true;
    },    
    routine(parentScope, statement) {
        if (!statement.routine) return false;
        scopes.open(parentScope, {}, scope => {
            engine.routine(scope, statement.routine);
        });
        return true;
    },
    template(scope, statement) {
        if (!statement.template) return false;
        const objects = evaluate.template(scope, statement.template);
        objects.forEach(object => scopes.add(scope, object));
        return true;
    },
}

const utils = {
    buildInput(input, parentValues) {
        if (!input) return {}

        const values = { ...input };
        for (const k in parentValues) {
            if (k in values)
                values[k] = parentValues[k];
        }
        return values;
    },
    buildAssign(scope, assign) {
        if (!assign) return {};

        return evaluate.deep(scope, assign);
    },
};

const engine = {
    statement(scope, statement) {
        statements.each(scope,     statement);
        statements.jsonpath(scope, statement);
        statements.script(scope,   statement);
        statements.assign(scope,   statement);
        statements.include(scope,  statement);
        statements.apply(scope,    statement);
        statements.add(scope,      statement);
        statements.patch(scope,    statement);
        statements.template(scope, statement);
        statements.routine(scope,  statement);
    },
    routine(scope, routine) {
        if (!routine)
            return;

        for (const statement of routine) {
            if (statement.if && !evaluate.script(scope, statement.if)) {
                continue;
            }
            if (statement.select) {
                const selector = compileSelectors(statement.select);
                const objects = scope.objects.filter(selector);
                scopes.open(scope, { objects, values: scope.values }, cscope => {
                    engine.statement(cscope, statement)
                });
            } else {
                engine.statement(scope, statement)
            }

            if (statements.break(scope, statement))
                return;
        }
    },
    run(file, parent, uri, withObject = false) {
        if (!file) return;

        if (!parent) throw 'no parent scope';
        uri = uri || '.';

        scopes.open(parent, { uri }, scope => {
            // 1. bind objects
            if (withObject)
                scope.objects = [ ...parent.objects ];

            // 2. build input
            scope.values = utils.buildInput(file.input, parent.values);

            // 3. validate schema
            if (file.schema) {
                const validate = ajv.compile(file.schema);
                const valid = validate(scope.values);
                if (!valid) {
                    const errtext = ajv.errorsText(validate.errors, { dataVar: 'input' });
                    throw pktError(scope, new Error(errtext), 'input validation failed');
                }
            }

            // 4. build values
            scope.values = {
                ...scope.values,
                ...evaluate.deep(scope, file.assign || {}),
            };

            // 5. run routine
            engine.routine(scope, file.routine);
        });
        return parent.objects;
    },
    exec(objects, values, files, config) {
        const scope = scopes.create(values, '.', null, config, objects);
        files.forEach(path => statements.apply(scope, { apply: path }));

        return scope.objects.map(o => jsyaml.dump(o)).join('---\n');
    }
}

class Config {
    constructor({ repositories }) {
        this.repositories = repositories || {};
    }
    resolve(uri) {
        if (uri[0] == ':') {
            const resolved = this.repositories[uri.substr(1)];
            if (!resolved) {
                throw new Error(`unknown repo ${uri}`)
            }
            return resolved;
        }
        return uri;
    }
}

const configs = {
    load() {
        try {
            const home = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
            const confPath = path.join(home, 'pkt.conf');
            const config = load.yaml(null, confPath);
            if (!config) config = {};
            return new Config(config);
        } catch (e) {
            return new Config({});
        }
    }
}

module.exports = { engine, configs, load, utils, evaluate, statements, run: engine.run };
