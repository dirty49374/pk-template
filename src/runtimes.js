const url = require('url');
const Ajv = require('ajv');
const jsyaml = require('js-yaml');
const jsonpath = require('jsonpath');
const jsonpatch = require('json-patch');

const utils = require('./utils');
const scopes = require('./scopes');
const loaders = require('./loaders');
const selectors = require('./selectors');
const evaluators = require('./evaluators');

const ajv = new Ajv({ allErrors: true });

const runtimes = {
    statements: {
        break(scope, statement) {
            if (!statement.break) return false;
            return true;
        },
        script(scope, statement) {
            if (!statement.script) return false;
            evaluators.script(scope, statement.script, {});
            return true;
        },
        each(scope, statement) {
            if (!statement.each) return false;
            scope.objects.forEach(o => {
                scope.object = o;
                evaluators.script(scope, statement.each, {});
            });
            delete scope.object;
            return true;
        },    
        assign(scope, statement) {
            if (!statement.assign) return false;
            scope.values = {
                ...scope.values,
                ...evaluators.deep(scope, statement.assign || {}),
            };
            return true;
        },
        add(scope, statement) {
            if (!statement.add) return false;
            const object = evaluators.deep(scope, statement.add);
            scopes.add(scope, object);
            return true;
        },
        include(scope, statement) {
            if (!statement.include) return false;

            const uri = statement.include;
            if (uri.toLowerCase().endsWith(".pkt")) {
                const file = loaders.yaml(scope, uri);
                runtimes.run(file, scope, uri);
            } else {
                const tpl = loaders.text(scope, uri);
                const objects = evaluators.template(scope, tpl);
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
                            const value = evaluators.deep(cscope, statement.jsonpath.apply);
                            jsonpath.apply(o, jsonpath.stringify(node.path), () => value);
                        } else if (statement.jsonpath.exec) {
                            evaluators.script(cscope, statement.jsonpath.exec);
                        }
                    });
                })
            });
        },
        apply(scope, statement) {
            if (!statement.apply) return false;

            const uri = statement.apply;
            if (uri.toLowerCase().endsWith(".pkt")) {
                const file = loaders.yaml(scope, uri);
                runtimes.run(file, scope, uri, true);
            } else {
                const tpl = loaders.text(scope, uri);
                const objects = evaluators.template(scope, tpl);
                scope.objects.push(...objects);
            }
            return true;
        },
        patch(scope, statement) {
            if (!statement.patch) return false;
            const patch = Array.isArray(statement.patch) ? statement.patch : [ statement.patch ];
            scope.objects.forEach(o => {
                scope.object = o;
                const p = evaluators.deep(scope, patch);
                jsonpatch.apply(o, p);
                delete scope.object;
            });
            delete scope.object;
            return true;
        },    
        routine(parentScope, statement) {
            if (!statement.routine) return false;
            scopes.open(parentScope, {}, scope => {
                runtimes.routine(scope, statement.routine);
            });
            return true;
        },
        kubeconfig(scope, statement) {
            if (!statement.kubeconfig) return false;
            scope.userdata.kubeconfig = evaluators.deep(scope, statement.kubeconfig);
            return true;
        },
        template(scope, statement) {
            if (!statement.template) return false;
            const objects = evaluators.template(scope, statement.template);
            objects.forEach(object => scopes.add(scope, object));
            return true;
        },
    },
    statement(scope, statement) {
        runtimes.statements.each(scope,     statement);
        runtimes.statements.jsonpath(scope, statement);
        runtimes.statements.script(scope,   statement);
        runtimes.statements.assign(scope,   statement);
        runtimes.statements.include(scope,  statement);
        runtimes.statements.apply(scope,    statement);
        runtimes.statements.add(scope,      statement);
        runtimes.statements.patch(scope,    statement);
        runtimes.statements.template(scope, statement);
        runtimes.statements.kubeconfig(scope, statement);
        runtimes.statements.routine(scope,  statement);
    },
    routine(scope, routine) {
        if (!routine)
            return;

        for (const statement of routine) {
            if (statement.if && !evaluators.script(scope, statement.if)) {
                continue;
            }
            if (statement.select) {
                const predicate = selectors.compile(statement.select);
                const objects = scope.objects.filter(predicate);
                scopes.open(scope, { objects, values: scope.values }, cscope => {
                    runtimes.statement(cscope, statement)
                });
            } else {
                runtimes.statement(scope, statement)
            }

            if (runtimes.statements.break(scope, statement))
                return;
        }
    },
    buildInput(input, parentValues) {
        if (!input) return {}

        const values = { ...input };
        for (const k in parentValues) {
            if (k in values)
                values[k] = parentValues[k];
        }
        return values;
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
            scope.values = runtimes.buildInput(file.input, parent.values);

            // 3. validate schema
            if (file.schema) {
                const validate = ajv.compile(file.schema);
                const valid = validate(scope.values);
                if (!valid) {
                    const errtext = ajv.errorsText(validate.errors, { dataVar: 'input' });
                    throw utils.pktError(scope, new Error(errtext), 'input validation failed');
                }
            }

            // 4. build values
            scope.values = {
                ...scope.values,
                ...evaluators.deep(scope, file.assign || {}),
            };

            // 5. run routine
            runtimes.routine(scope, file.routine);
        });
        return parent.objects;
    },
    exec(objects, values, files, config, userdata) {
        const scope = scopes.create(values, '.', null, config, objects, userdata || {});
        files.forEach(path => runtimes.statements.apply(scope, { apply: path }));

        return scope.objects.map(o => jsyaml.dump(o)).join('---\n');
    }
}

module.exports = runtimes;