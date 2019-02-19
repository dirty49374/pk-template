import Ajv from 'ajv';

import * as utils from './utils';
import { Scope } from './scope';
import selectors from './selectors';
import { IScope, IValues, IPkt, IConfig, IStatement, IUserdata } from './types';
import { getJsonPath, getJsonPatch } from './lazy';
import { IObject } from '../common';
import { StyleSheet } from './styles/styleSheet';

const ajv = new Ajv({ allErrors: true });

const statements = {
    break(stmt: IStatement) {
        if (!stmt.break) return false;
        return true;
    },
    script(scope: IScope, stmt: IStatement) {
        if (!stmt.script) return false;
        scope.evaluator.evalScript(stmt.script);
        return true;
    },
    each(scope: IScope, stmt: IStatement) {
        if (!stmt.each) return false;
        scope.objects.forEach(o => {
            scope.object = o;
            scope.evaluator.evalScript(stmt.each);
        });
        delete scope.object;
        return true;
    },
    assign(scope: IScope, stmt: IStatement) {
        if (!stmt.assign) return false;

        const values = typeof stmt.assign == 'string'
            ? utils.parseKvps(stmt.assign)
            : scope.evaluator.evalObject(stmt.assign || {});
        scope.values = {
            ...scope.values,
            ...values,
        };
        return true;
    },
    add(scope: IScope, stmt: IStatement) {
        if (!stmt.add) return false;
        const object = scope.evaluator.evalObject(stmt.add);
        scope.add(object);
        return true;
    },
    include(scope: IScope, stmt: IStatement) {
        if (!stmt.include) return false;

        const rpath = stmt.include;
        if (rpath.toLowerCase().endsWith(".pkt")) {
            const { uri, data } = scope.loader.loadPkt(rpath);
            run(data, scope, uri);
        } else {
            const { uri, data } = scope.loader.loadText(rpath);
            const objects = scope.evaluator.evalTemplateAll(data);
            objects.forEach(object => scope.add(object));
        }
        return true;
    },
    includeWith(scope: IScope, stmt: IStatement) {
        if (!stmt.includeWith) return false;
        const idx = stmt.includeWith.indexOf(' ')
        const rpath = idx >= 0
            ? stmt.includeWith.substring(0, idx)
            : stmt.includeWith;
        const kvps = idx >= 0
            ? stmt.includeWith.substring(idx)
            : "";
        const values = utils.parseKvps(kvps);
        scope.child({}, (cscope: IScope) => {
            cscope.values = { ...scope.values, ...values };

            if (rpath.toLowerCase().endsWith(".pkt")) {
                const { uri, data } = cscope.loader.loadPkt(rpath);
                run(data, cscope, uri);
            } else {
                const { uri, data } = cscope.loader.loadText(rpath);
                const objects = cscope.evaluator.evalTemplateAll(data);
                objects.forEach(object => cscope.add(object));
            }
        });

        return true;
    },
    jsonpath(scope: IScope, stmt: IStatement) {
        if (!stmt.jsonpath) return false;
        const jsonpath = getJsonPath();
        scope.objects.forEach(o => {
            const nodes = jsonpath.nodes(o, stmt.jsonpath.query);
            nodes.forEach((node: any) => {
                scope.child({}, cscope => {
                    cscope.object = o;
                    // XXX: ??
                    // cscope.path = node.path;
                    // cscope.value = node.value;

                    if (stmt.jsonpath.apply) {
                        const value = cscope.evaluator.evalObject(stmt.jsonpath.apply);
                        jsonpath.apply(o, jsonpath.stringify(node.path), () => value);
                    }
                    if (stmt.jsonpath.merge) {
                        const value = cscope.evaluator.evalObject(stmt.jsonpath.merge);
                        const merged = { ...node.value, ...value };
                        jsonpath.apply(o, jsonpath.stringify(node.path), () => merged);
                    }
                    if (stmt.jsonpath.exec) {
                        cscope.evaluator.evalScript(stmt.jsonpath.exec);
                    }
                });
            })
        });
    },
    apply(scope: IScope, stmt: IStatement) {
        if (!stmt.apply) return false;

        const rpath = stmt.apply;
        if (rpath.toLowerCase().endsWith(".pkt")) {
            const { uri, data } = scope.loader.loadPkt(rpath);
            run(data, scope, uri, true);
        } else {
            const { uri, data } = scope.loader.loadText(rpath);
            const objects = scope.evaluator.evalTemplateAll(data);
            scope.objects.push(...objects);
        }
        return true;
    },
    applyWith(scope: IScope, stmt: IStatement) {
        if (!stmt.applyWith) return false;
        const idx = stmt.applyWith.indexOf(' ')
        const rpath = idx >= 0
            ? stmt.applyWith.substring(0, idx)
            : stmt.applyWith;
        const kvps = idx >= 0
            ? stmt.applyWith.substring(idx)
            : "";
        const values = utils.parseKvps(kvps);
        scope.child({ objects: scope.objects }, cscope => {
            cscope.values = { ...scope.values, ...values };

            if (rpath.toLowerCase().endsWith(".pkt")) {
                const { uri, data } = scope.loader.loadPkt(rpath);
                run(data, scope, uri, true);
            } else {
                const { uri, data } = scope.loader.loadText(rpath);
                const objects = scope.evaluator.evalTemplateAll(data);
                scope.objects.push(...objects);
            }
        });
        return true;
    },
    patch(scope: IScope, stmt: IStatement) {
        if (!stmt.patch) return false;
        const jsonpatch = getJsonPatch();
        const patch = Array.isArray(stmt.patch) ? stmt.patch : [stmt.patch];
        scope.objects.forEach(o => {
            scope.object = o;
            const p = scope.evaluator.evalObject(patch);
            jsonpatch.apply(o, p);
            delete scope.object;
        });
        delete scope.object;
        return true;
    },
    routine(parentScope: IScope, stmt: IStatement) {
        if (!stmt.routine) return false;
        parentScope.child({}, scope => {
            routine(scope, stmt.routine);
        });
        return true;
    },
    routineWith(parentScope: IScope, stmt: IStatement) {
        if (!stmt.routineWith) return false;
        parentScope.child({ objects: parentScope.objects }, scope => {
            routine(scope, stmt.routineWith);
        });
        return true;
    },
    kubeconfig(scope: IScope, stmt: IStatement) {
        if (!stmt.kubeconfig) return false;
        scope.userdata.kubeconfig = scope.evaluator.evalObject(stmt.kubeconfig);
        return true;
    },
    template(scope: IScope, stmt: IStatement) {
        if (!stmt.template) return false;
        const objects = scope.evaluator.evalTemplateAll(stmt.template);
        objects.forEach(object => scope.add(object));
        return true;
    },
}

export function statement(scope: IScope, stmt: IStatement) {
    statements.each(scope, stmt);
    statements.jsonpath(scope, stmt);
    statements.script(scope, stmt);
    statements.assign(scope, stmt);
    statements.include(scope, stmt);
    statements.includeWith(scope, stmt);
    statements.apply(scope, stmt);
    statements.applyWith(scope, stmt);
    statements.add(scope, stmt);
    statements.patch(scope, stmt);
    statements.template(scope, stmt);
    statements.kubeconfig(scope, stmt);
    statements.routine(scope, stmt);
    statements.routineWith(scope, stmt);
}

export function routine(scope: IScope, routine: IStatement) {
    if (!routine)
        return;

    for (const stmt of routine) {
        if (stmt.if && !scope.evaluator.evalScript(stmt.if)) {
            continue;
        }
        if (stmt.select) {
            const predicate = selectors.compile(stmt.select);
            const objects = scope.objects.filter(predicate);
            scope.child({ objects, values: scope.values }, cscope => {
                statement(cscope, stmt)
            });
        } else {
            statement(scope, stmt)
        }

        if (statements.break(stmt))
            return;
    }
}

export function buildInput(input: any, parentValues: IValues): any {
    if (!input) return {}

    const values = { ...input };
    for (const k in parentValues) {
        if (k in values)
            values[k] = parentValues[k];
    }
    return values;
}

export function run(file: IPkt, parentScope: IScope, uri: string, withObject: boolean = false) {
    if (!file) return;

    if (!parentScope) throw 'no parent scope';
    uri = uri || '.';

    parentScope.child({ uri }, scope => {
        // 0. Class
        const styleSheet = new StyleSheet(parentScope.styleSheet);
        if (file.style) {
            styleSheet.load(file.style);
        }
        if (file.import) {
            const _importSs = (rpath: string) => {
                if (uri.toLowerCase().endsWith(".pkt")) {
                    const { uri, data } = scope.loader.loadPkt(rpath);
                    if (data.style) {
                        scope.styleSheet.load(data.style);
                    }
                }
                return true;
            };
            if (Array.isArray(file.import)) {
                for (let path of file.import) {
                    _importSs(path);
                }
            } else {
                _importSs(file.import);
            }
        }

        scope.styleSheet = styleSheet;

        // 1. bind objects
        if (withObject)
            scope.objects = [...parentScope.objects];

        // 2. build input
        scope.values = buildInput(file.input, parentScope.values);

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
            ...scope.evaluator.evalObject(file.assign || {}),
        };

        // 5. run routine
        routine(scope, file.routine);
    });
    return parentScope.objects;
}

export function exec(objects: IObject[], values: IValues, files: string[], config: IConfig, userdata: IUserdata): IObject[] {
    const scope = Scope.Create(values, '.', null, config, objects, new StyleSheet(null), userdata || {});
    files.forEach(path => statements.apply(scope, { apply: path }));

    return scope.objects;
}
