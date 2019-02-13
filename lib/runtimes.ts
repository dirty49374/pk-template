import Ajv from 'ajv';
import jsyaml from 'js-yaml';
import jsonpath from 'jsonpath';
import jsonpatch from 'json-patch';

import * as utils from './utils';
import scopes from './scopes';
import loaders from './loaders';
import selectors from './selectors';
import evaluators from './evaluators';
import { IScope } from './scope';

const ajv = new Ajv({ allErrors: true });

const runtimes = {
    statements: {
        break(scope: IScope, statement: IStatement) {
            if (!statement.break) return false;
            return true;
        },
        script(scope: IScope, statement: IStatement) {
            if (!statement.script) return false;
            evaluators.script(scope, statement.script);
            return true;
        },
        each(scope: IScope, statement: IStatement) {
            if (!statement.each) return false;
            scope.objects.forEach(o => {
                scope.object = o;
                evaluators.script(scope, statement.each);
            });
            delete scope.object;
            return true;
        },    
        assign(scope: IScope, statement: IStatement) {
            if (!statement.assign) return false;

            const values = typeof statement.assign == 'string'
                ? utils.parseKvps(statement.assign)
                : evaluators.deep(scope, statement.assign || {});
            scope.values = {
                ...scope.values,
                ...values,
            };
            return true;
        },
        add(scope: IScope, statement: IStatement) {
            if (!statement.add) return false;
            const object = evaluators.deep(scope, statement.add);
            scope.add(object);
            return true;
        },
        include(scope: IScope, statement: IStatement) {
            if (!statement.include) return false;

            const uri = scope.resolve(statement.include);
            if (uri.toLowerCase().endsWith(".pkt")) {
                const file = loaders.pkt(scope, uri);
                runtimes.run(file, scope, uri);
            } else {
                const tpl = loaders.text(scope, uri);
                const objects = evaluators.template(scope, tpl);
                objects.forEach(object => scope.add(object));
            }
            return true;
        },
        includeWith(scope: IScope, statement: IStatement) {
            if (!statement.includeWith) return false;
            const idx = statement.includeWith.indexOf(' ')
            const path = idx >= 0
                ? statement.includeWith.substring(0, idx)
                : statement.includeWith;
            const kvps = idx >= 0
                ? statement.includeWith.substring(idx)
                : "";
            const values = utils.parseKvps(kvps);
            scope.child({}, (cscope: IScope) => {
                cscope.values = { ...scope.values, ...values };
                const uri = scope.resolve(path);

                if (uri.toLowerCase().endsWith(".pkt")) {
                    const file = loaders.pkt(cscope, uri);
                    runtimes.run(file, cscope, uri);
                } else {
                    const tpl = loaders.text(cscope, uri);
                    const objects = evaluators.template(cscope, tpl);
                    objects.forEach(object => cscope.add(object));
                }
            });

            return true;
        },
        jsonpath(scope: IScope, statement: IStatement) {
            if (!statement.jsonpath) return false;
            scope.objects.forEach(o => {
                const nodes = jsonpath.nodes(o, statement.jsonpath.query);
                nodes.forEach(node => {
                    scope.child({}, cscope => {
                        cscope.object = o;
                        // XXX: ??
                        // cscope.path = node.path;
                        // cscope.value = node.value;
    
                        if (statement.jsonpath.apply) {
                            const value = evaluators.deep(cscope, statement.jsonpath.apply);
                            jsonpath.apply(o, jsonpath.stringify(node.path), () => value);
                        }
                        if (statement.jsonpath.merge) {
                            const value = evaluators.deep(cscope, statement.jsonpath.merge);
                            const merged = { ...node.value, ...value };
                            jsonpath.apply(o, jsonpath.stringify(node.path), () => merged);
                        }
                        if (statement.jsonpath.exec) {
                            evaluators.script(cscope, statement.jsonpath.exec);
                        }
                    });
                })
            });
        },
        apply(scope: IScope, statement: IStatement) {
            if (!statement.apply) return false;

            const uri = scope.resolve(statement.apply);
            if (uri.toLowerCase().endsWith(".pkt")) {
                const file = loaders.pkt(scope, uri);
                runtimes.run(file, scope, uri, true);
            } else {
                const tpl = loaders.text(scope, uri);
                const objects = evaluators.template(scope, tpl);
                scope.objects.push(...objects);
            }
            return true;
        },
        applyWith(scope: IScope, statement: IStatement) {
            if (!statement.applyWith) return false;
            const idx = statement.applyWith.indexOf(' ')
            const path = idx >= 0
                ? statement.applyWith.substring(0, idx)
                : statement.applyWith;
            const kvps = idx >= 0
                ? statement.applyWith.substring(idx)
                : "";
            const values = utils.parseKvps(kvps);
            scope.child({ objects: scope.objects }, cscope => {
                cscope.values = { ...scope.values, ...values };
                const uri = scope.resolve(path);
        
                if (uri.toLowerCase().endsWith(".pkt")) {
                    const file = loaders.pkt(cscope, uri);
                    runtimes.run(file, cscope, uri, true);
                } else {
                    const tpl = loaders.text(cscope, uri);
                    const objects = evaluators.template(cscope, tpl);
                    cscope.objects.push(...objects);
                }
            });
            return true;
        },
        patch(scope: IScope, statement: IStatement) {
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
        routine(parentScope: IScope, statement: IStatement) {
            if (!statement.routine) return false;
            parentScope.child({}, scope => {
                runtimes.routine(scope, statement.routine);
            });
            return true;
        },
        routineWith(parentScope: IScope, statement: IStatement) {
            if (!statement.routineWith) return false;
            parentScope.child({ objects: parentScope.objects }, scope => {
                runtimes.routine(scope, statement.routineWith);
            });
            return true;
        },
        kubeconfig(scope: IScope, statement: IStatement) {
            if (!statement.kubeconfig) return false;
            scope.userdata.kubeconfig = evaluators.deep(scope, statement.kubeconfig);
            return true;
        },
        template(scope: IScope, statement: IStatement) {
            if (!statement.template) return false;
            const objects = evaluators.template(scope, statement.template);
            objects.forEach(object => scope.add(object));
            return true;
        },
    },
    statement(scope: IScope, statement: IStatement) {
        runtimes.statements.each(scope,        statement);
        runtimes.statements.jsonpath(scope,    statement);
        runtimes.statements.script(scope,      statement);
        runtimes.statements.assign(scope,      statement);
        runtimes.statements.include(scope,     statement);
        runtimes.statements.includeWith(scope, statement);
        runtimes.statements.apply(scope,       statement);
        runtimes.statements.applyWith(scope,   statement);
        runtimes.statements.add(scope,         statement);
        runtimes.statements.patch(scope,       statement);
        runtimes.statements.template(scope,    statement);
        runtimes.statements.kubeconfig(scope,  statement);
        runtimes.statements.routine(scope,     statement);
        runtimes.statements.routineWith(scope, statement);
    },
    routine(scope: IScope, routine: IStatement) {
        if (!routine)
            return;

        for (const statement of routine) {
            if (statement.if && !evaluators.script(scope, statement.if)) {
                continue;
            }
            if (statement.select) {
                const predicate = selectors.compile(statement.select);
                const objects = scope.objects.filter(predicate);
                scope.child({ objects, values: scope.values }, cscope => {
                    runtimes.statement(cscope, statement)
                });
            } else {
                runtimes.statement(scope, statement)
            }

            if (runtimes.statements.break(scope, statement))
                return;
        }
    },
    buildInput(input: any, parentValues: any): any {
        if (!input) return {}

        const values = { ...input };
        for (const k in parentValues) {
            if (k in values)
                values[k] = parentValues[k];
        }
        return values;
    },
    run(file: IPkt, parentScope: IScope, uri: string, withObject: boolean = false) {
        if (!file) return;

        if (!parentScope) throw 'no parent scope';
        uri = uri || '.';

        parentScope.child({ uri }, scope => {
            // 1. bind objects
            if (withObject)
                scope.objects = [ ...parentScope.objects ];

            // 2. build input
            scope.values = runtimes.buildInput(file.input, parentScope.values);

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
        return parentScope.objects;
    },
    exec(objects: any[], values: any, files: string[], config: IConfig, userdata: IUserdata) {
        const scope = scopes.create(values, '.', null, config, objects, userdata || {});
        files.forEach(path => runtimes.statements.apply(scope, { apply: path }));

        return scope.objects.map(o => jsyaml.dump(o)).join('---\n');
    }
}

module.exports = runtimes;