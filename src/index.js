const _ = require('underscore');
const fs = require("fs");
const url = require('url');
const jsyaml = require('js-yaml');
const syncRequest = require('sync-request');
const coffeeScript = require('coffee-script');

_.templateSettings = {
    interpolate: /\<\<\<\=(.+?)\>\>\>/g,
    evaluate: /\<\<\<\_(.+?)\>\>\>/g,
};

const clone = obj => JSON.parse(JSON.stringify(obj));
const scopes = {
    create(values, uri, parent, objects) {
        return {
            objects: objects ? [ ...objects ] : [],
            values: values ? clone(values) : {},
            uri: uri || '.',
            parent: parent || null
        };
    },
    open(parent, uri, func) {
        const scope = clone(parent);
        scope.uri = uri || '.';
        scope.parent = parent;

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
    text(uri) {
        const urlPrefixes = [ 'http://', 'https://' ];
        const isAbsoluteUrl = p => urlPrefixes.some(prefix => p.startsWith(prefix));
        
        return isAbsoluteUrl(uri)
            ? syncRequest('GET', uri).getBody('utf8')
            : fs.readFileSync(uri, 'utf8');
    },
    yaml(uri) {
        const text = load.text(uri);
        return jsyaml.load(text);
    },
    template(uri) {
        const text = load.text(uri);
        return _.template(text);
    }
}

const lib = scope => ({
    add: object => scopes.add(scope, object),
    expand: path => actions.include(scope, { include: path }),
    loadText: path => load.text(url.resolve(scope.uri, path)),
    loadYaml: path => jsyaml.load(load.text(path)),
    loadYamlAll: path => jsyaml.loadAll(load.text(path)),
    loadTemplate: path => load.template(path),
});

const evaluate = {
    eval(scope, script) {
        const $ = scope;
        const $lib = lib(scope);
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
    },
    template(scope, text) {
        const tpl = _.template(text);
        const yaml = tpl({
            ...scope.values,
            $: scope
        });
        const objects = jsyaml.loadAll(yaml);
        return objects;
    },
}

const actions = {
    break(scope, action) {
        if (!action.break) return false;
        return true;
    },
    script(scope, action) {
        if (!action.script) return false;
        evaluate.script(scope, action.script, {});
        return true;
    },
    assign(scope, action) {
        if (!action.assign) return false;
        scope.values = {
            ...scope.values,
            ...utils.buildAssign(scope, action.assign),
        };
        return true;
    },
    include(scope, action) {
        if (!action.include) return false;
        const uri = url.resolve(scope.uri, action.include);

        if (uri.toLowerCase().endsWith(".pkt")) {
            const file = load.yaml(uri);
            engine.run(file, scope, uri);
        } else {
            const tpl = load.text(uri);
            const objects = evaluate.template(scope, tpl);
            objects.forEach(object => scopes.add(scope, object));
        }
        return true;
    },
    includeWith(scope, action) {
        if (!action.includeWith) return false;
        const uri = url.resolve(scope.uri, action.includeWith);

        if (uri.toLowerCase().endsWith(".pkt")) {
            const file = load.yaml(uri);
            engine.run(file, scope, uri, true);
        } else {
            const tpl = load.text(uri);
            const objects = evaluate.template(scope, tpl);
            scope.objects.push(...objects);
        }
        return true;
    },
    routine(scope, action) {
        if (!action.routine) return false;
        scopes.open(scope, scope.uri, scope => {
            engine.routine(scope, action.routine);
        });
        return true;
    },
    template(scope, action) {
        if (!action.template) return false;
        const objects = evaluate.template(scope, action.template);
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

        for (const action of routine) {
            if (action.if && !evaluate.script(scope, action.if)) {
                continue;
            }

            actions.script(scope,      action);
            actions.assign(scope,      action);
            actions.include(scope,     action);
            actions.includeWith(scope, action);
            actions.template(scope,    action);
            actions.routine(scope,     action);

            if (actions.break(scope, action))
                return;
        }
    },
    run(file, parent, uri, withObject = false) {
        if (!file) return;

        parent = parent || scopes.create();
        uri = uri || '.';

        scopes.open(parent, uri, scope => {
            // 1. bind objects
            if (withObject)
                scope.objects = [ ...parent.objects ];

            // 1. build input & values
            scope.values = utils.buildInput(file.input, parent.values);
            scope.values = {
                ...scope.values,
                ...utils.buildAssign(scope, file.assign || {}),
            };

            // 2. run routine
            engine.routine(scope, file.routine);
        });
        return parent.objects;
    },
    exec(objects, values, files) {
        const scope = scopes.create(values, '.', null, objects);
        files.forEach(path => actions.include(scope, { include: path }));
        return scope.objects.map(o => jsyaml.dump(o)).join('---\n');
    }
}

module.exports = engine;
