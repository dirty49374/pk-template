const _ = require('underscore');
const fs = require("fs");
const url = require('url');
const path = require('path');
const jsyaml = require('js-yaml');
const syncRequest = require('sync-request');
const coffeeScript = require('coffee-script');
const Ajv = require('ajv');
const ajv = new Ajv({allErrors: true});

_.templateSettings = {
    interpolate: /\<\<\<\=(.+?)\>\>\>/g,
    evaluate: /\<\<\<\_(.+?)\>\>\>/g,
};

const pktError = (scope, error, message) => {
    error.summary = message;
    error.uri = scope.uri;
    return error;
}

const compileSelector = src => {
    const nv = src.split('=');

    if (nv.length > 1) {
        const name = nv[0];
        const value = nv[1];
        if (type === '!') {
            return object =>
                object.metadata &&
                object.metadata.annotations &&
                (
                    value === '*'
                        ? name in object.metadata.annotations
                        : object.metadata.annotations[name] === value
                );
        }
        return object =>
            object.metadata &&
            object.metadata.labels &&
            (
                value === '*'
                    ? name in object.metadata.labels
                    : object.metadata.labels[name] === value
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
    open(parent, uri, func) {
        const scope = {
            objects: [],
            values: clone(parent.values),
            uri,
            parent,
            config: parent.config
        };

        func(scope);
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
            return jsyaml.load(text);
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
    loadYaml: path => jsyaml.load(load.text(scope, path)),
    loadYamlAll: path => jsyaml.loadAll(load.text(scope, path)),
    loadTemplate: path => load.template(scope, path),
    setannotation: (object, name, value) => {
        if (!object.metadata) object.metadata = {};
        if (!object.metadata.annotations) object.metadata.annotations = {};
        object.metadata.annotations[name] = value;

    },
    setlabel: (object, name, value) => {
        if (!object.metadata) object.metadata = {};
        if (!object.metadata.labels) object.metadata.labels = {};
        object.metadata.labels[name] = value;
    }
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
    javsScript(scope, javascript) {
        return evaluate.eval(scope, javascript);
    },
    coffeeScript(scope, coffeescript) {
        const javascript = coffeeScript.compile(coffeescript, { bare: true });
        return evaluate.javsScript(scope, javascript);
    },
    script(scope, script) {
        try {
            const regex = /^(\w+)>\s/;
            const match = script.match(regex);
            if (match) {
                switch (match[1].toLowerCase()) {
                    case 'js':
                        return evaluate.javsScript(scope, script.substr(match[0].length));
                    case 'coffee':
                        return evaluate.coffeeScript(scope, script.substr(match[0].length));
                }
                return evaluate.coffeeScript(scope, script);
            }
            return evaluate.coffeeScript(scope, script);    
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
            const objects = jsyaml.loadAll(yaml);
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
            ...utils.buildAssign(scope, statement.assign),
        };
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
    routine(parentScope, statement) {
        if (!statement.routine) return false;
        scopes.open(parentScope, parentScope.uri, scope => {
            if (statement.select) {
                const selector = compileSelectors(statement.select);
                scope.objects = parentScope.objects.filter(selector);
            }
        
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

        const values = {};
        Object
            .keys(assign)
            .forEach(key => {
                if (!key.endsWith('$')) {
                    values[key] = assign[key];
                } else {
                    values[key.substring(0, key.length - 1)] =
                        evaluate.script(scope, assign[key], {});
                }
            });
        return values;
    },
};

const engine = {
    routine(scope, routine) {
        if (!routine)
            return;

        for (const statement of routine) {
            if (statement.if && !evaluate.script(scope, statement.if)) {
                continue;
            }

            statements.each(scope,     statement);
            statements.script(scope,   statement);
            statements.assign(scope,   statement);
            statements.include(scope,  statement);
            statements.apply(scope,    statement);
            statements.template(scope, statement);
            statements.routine(scope,  statement);

            if (statements.break(scope, statement))
                return;
        }
    },
    run(file, parent, uri, withObject = false) {
        if (!file) return;

        if (!parent) throw 'no parent scope';
        uri = uri || '.';

        scopes.open(parent, uri, scope => {
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
                ...utils.buildAssign(scope, file.assign || {}),
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
