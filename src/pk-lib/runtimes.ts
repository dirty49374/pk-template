import Ajv from 'ajv';

import * as utils from './utils';
import { Scope } from './scope';
import selectors from './selectors';
import { IScope, IValues, IPkt, IConfig, IStatement, IUserdata } from './types';
import { getJsonPath, getJsonPatch } from './lazy';
import { IObject } from '../common';
import { StyleSheet } from './styles/styleSheet';
import { Schema } from './schema';



export function buildInput(input: any, parentValues: IValues): any {
    if (!input) return {}

    const values = { ...input };
    for (const k in parentValues) {
        if (k in values)
            values[k] = parentValues[k];
    }
    return values;
}
export class Runtime {

    break(stmt: IStatement) {
        if (!stmt.break) return false;
        return true;
    }
    scriptStatement(scope: IScope, stmt: IStatement) {
        if (!stmt.script) return false;
        scope.evalScript(stmt.script);
        return true;
    }
    eachStatement(scope: IScope, stmt: IStatement) {
        if (!stmt.each) return false;
        scope.objects.forEach(o => {
            scope.object = o;
            scope.evalScript(stmt.each);
        });
        delete scope.object;
        return true;
    }
    assignStatement(scope: IScope, stmt: IStatement) {
        if (!stmt.assign) return false;

        const values = typeof stmt.assign == 'string'
            ? utils.parseKvps(stmt.assign)
            : scope.evalObject(stmt.assign || {});
        scope.values = {
            ...scope.values,
            ...values,
        };
        return true;
    }
    addStatement(scope: IScope, stmt: IStatement) {
        if (!stmt.add) return false;
        const object = scope.evalObject(stmt.add);
        scope.add(object);
        return true;
    }
    includeStatement(scope: IScope, stmt: IStatement) {
        if (!stmt.include) return false;

        const rpath = stmt.include;
        if (rpath.toLowerCase().endsWith(".pkt")) {
            const { uri, data } = scope.loadPkt(rpath);
            this.execPkt(data, scope, uri);
        } else {
            const { uri, data } = scope.loadText(rpath);
            const objects = scope.evalTemplateAll(data);
            objects.forEach(object => scope.add(object));
        }
        return true;
    }
    includeWithStatement(scope: IScope, stmt: IStatement) {
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
                const { uri, data } = cscope.loadPkt(rpath);
                this.execPkt(data, cscope, uri);
            } else {
                const { uri, data } = cscope.loadText(rpath);
                const objects = cscope.evalTemplateAll(data);
                objects.forEach(object => cscope.add(object));
            }
        });

        return true;
    }
    jsonpathStatement(scope: IScope, stmt: IStatement) {
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
                        const value = cscope.evalObject(stmt.jsonpath.apply);
                        jsonpath.apply(o, jsonpath.stringify(node.path), () => value);
                    }
                    if (stmt.jsonpath.merge) {
                        const value = cscope.evalObject(stmt.jsonpath.merge);
                        const merged = { ...node.value, ...value };
                        jsonpath.apply(o, jsonpath.stringify(node.path), () => merged);
                    }
                    if (stmt.jsonpath.exec) {
                        cscope.evalScript(stmt.jsonpath.exec);
                    }
                });
            })
        });
    }
    applyStatement(scope: IScope, stmt: IStatement) {
        if (!stmt.apply) return false;

        const rpath = stmt.apply;
        if (rpath.toLowerCase().endsWith(".pkt")) {
            const { uri, data } = scope.loadPkt(rpath);
            this.execPkt(data, scope, uri, true);
        } else {
            const { uri, data } = scope.loadText(rpath);
            const objects = scope.evalTemplateAll(data);
            scope.objects.push(...objects);
        }
        return true;
    }
    applyWithStatement(scope: IScope, stmt: IStatement) {
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
                const { uri, data } = scope.loadPkt(rpath);
                this.execPkt(data, scope, uri, true);
            } else {
                const { uri, data } = scope.loadText(rpath);
                const objects = scope.evalTemplateAll(data);
                scope.objects.push(...objects);
            }
        });
        return true;
    }
    patchStatement(scope: IScope, stmt: IStatement) {
        if (!stmt.patch) return false;
        const jsonpatch = getJsonPatch();
        const patch = Array.isArray(stmt.patch) ? stmt.patch : [stmt.patch];
        scope.objects.forEach(o => {
            scope.object = o;
            const p = scope.evalObject(patch);
            jsonpatch.apply(o, p);
            delete scope.object;
        });
        delete scope.object;
        return true;
    }
    routineStatement(parentScope: IScope, stmt: IStatement) {
        if (!stmt.routine) return false;
        parentScope.child({}, scope => {
            this.execRoutine(scope, stmt.routine);
        });
        return true;
    }
    routineWithStatement(parentScope: IScope, stmt: IStatement) {
        if (!stmt.routineWith) return false;
        parentScope.child({ objects: parentScope.objects }, scope => {
            this.execRoutine(scope, stmt.routineWith);
        });
        return true;
    }
    kubeconfigStatement(scope: IScope, stmt: IStatement) {
        if (!stmt.kubeconfig) return false;
        scope.userdata.kubeconfig = scope.evalObject(stmt.kubeconfig);
        return true;
    }
    templateStatement(scope: IScope, stmt: IStatement) {
        if (!stmt.template) return false;
        const objects = scope.evalTemplateAll(stmt.template);
        objects.forEach(object => scope.add(object));
        return true;
    }

    execStatement(scope: IScope, stmt: IStatement) {
        this.eachStatement(scope, stmt);
        this.jsonpathStatement(scope, stmt);
        this.scriptStatement(scope, stmt);
        this.assignStatement(scope, stmt);
        this.includeStatement(scope, stmt);
        this.includeWithStatement(scope, stmt);
        this.applyStatement(scope, stmt);
        this.applyWithStatement(scope, stmt);
        this.addStatement(scope, stmt);
        this.patchStatement(scope, stmt);
        this.templateStatement(scope, stmt);
        this.kubeconfigStatement(scope, stmt);
        this.routineStatement(scope, stmt);
        this.routineWithStatement(scope, stmt);
    }

    execRoutine(scope: IScope, routine: IStatement) {
        if (!routine)
            return;

        for (const stmt of routine) {
            if (stmt.if && !scope.evalScript(stmt.if)) {
                continue;
            }
            if (stmt.select) {
                const predicate = selectors.compile(stmt.select);
                const objects = scope.objects.filter(predicate);
                scope.child({ objects, values: scope.values }, cscope => {
                    this.execStatement(cscope, stmt)
                });
            } else {
                this.execStatement(scope, stmt)
            }

            if (this.break(stmt))
                return;
        }
    }

    execPkt(file: IPkt, parentScope: IScope, uri: string, withObject: boolean = false) {
        if (!file) return;

        if (!parentScope) throw 'no parent scope';
        uri = uri || '.';

        parentScope.child({ uri }, scope => {
            // 0. style sheets
            scope.styleSheet = StyleSheet.Build(scope, file);

            // 1. bind objects
            if (withObject)
                scope.objects = [...parentScope.objects];

            // 2. build input
            scope.values = buildInput(file.input, parentScope.values);

            // 3. validate schema
            if (file.schema) {
                const schema = new Schema(file.schema);
                const errors = schema.validate(scope.values);
                if (errors) {
                    throw utils.pktError(scope, new Error(errors), 'input validation failed');
                }
            }

            // 4. build values
            scope.values = {
                ...scope.values,
                ...scope.evalObject(file.assign || {}),
            };

            // 5. run routine
            this.execRoutine(scope, file.routine);
        });
        return parentScope.objects;
    }

    static Exec(objects: IObject[], values: IValues, files: string[], config: IConfig, userdata: IUserdata): IObject[] {
        const scope = Scope.Create(
            values,
            '.',
            null,
            config,
            objects,
            new StyleSheet(null),
            userdata || {}
        );

        const runtime = new Runtime();
        for (const path of files) {
            runtime.applyStatement(scope, { apply: path });
        }

        return scope.objects;
    }
}
