import { IStatementSpecs, IRuntime, IScope, PkStatementResult } from "./types";
import { Runtime, IValues } from ".";
import { getJsonPath, getJsonPatch } from "../lazy";
import { pktError } from "./utils";
import { StyleSheet } from './styles/styleSheet';
import { Schema } from "./schema";
import selectors from "./selectors";

const pktLanguage = {
    'pkt': {
        ['/pkt']: {
            name: '/pkt',
            order: 100,
            handler: (runtime: IRuntime, scope: IScope, stmt: any): PkStatementResult => {
                if (!stmt) return {};
                if (!stmt.file.length) return {};
                if (!scope) throw 'no parent scope';

                const uri = stmt.uri;
                const withObject = stmt.withObject;

                scope.trace.into(() => {
                    const values = JSON.parse(JSON.stringify(scope.values));
                    scope.child({ uri, values }, cscope => {
                        if (withObject) {
                            cscope.objects = [...scope.objects];
                        }

                        for (let i = 0; i < stmt.file.length; ++i) {
                            cscope.trace.step(i);
                            if (i == 0) {
                                if (stmt.file[0]['/properties'] || stmt.file[0]['/schema']) {
                                    const rst = runtime.execute(cscope, stmt.file[i], 'pkt:/pkt-header');
                                    if (rst.exit) {
                                        return {};
                                    }
                                    continue;
                                } else {
                                    const rst = runtime.execute(cscope, {}, 'pkt:/pkt-header');
                                    if (rst.exit) {
                                        return {};
                                    }
                                }
                            }
                            const rst = runtime.execute(cscope, stmt.file[i], 'pkt-statement');
                            if (rst.exit) {
                                return {};
                            }
                        }
                    });
                });
                return {};
            },
        },
        ['/pkt-header']: {
            name: '/pkt-header',
            order: 100,
            handler: (runtime: IRuntime, scope: IScope, stmt: any): PkStatementResult => {
                const buildProperties = (properties: any, parentValues: IValues): any => {
                    const values = {
                        cluster: null,
                        env: null,
                        namespace: null,
                        ...(properties || {}),
                    };
                    for (const k in parentValues) {
                        if (k in values)
                            values[k] = parentValues[k];
                    }
                    return values;
                }

                // 0. style sheets
                scope.trace.step('/stylesheet');
                scope.styleSheet = StyleSheet.Build(scope, stmt);

                // 2. build properties
                scope.trace.step('/properties');
                if (stmt['/properties']) {
                    scope.values = buildProperties(stmt['/properties'], scope.values);
                }

                // 3. validate schema
                if (stmt['/schema']) {
                    scope.trace.step('schema');
                    const schema = new Schema(stmt['/schema']);
                    const errors = schema.validate(scope.values);
                    if (errors) {
                        throw pktError(scope, new Error(errors), 'property validation failed');
                    }
                }

                // 4. build values
                if (stmt['/values']) {
                    scope.trace.step('/values');
                    scope.values = {
                        ...scope.values,
                        ...scope.evalObject(stmt['/values'] || {}),
                    };
                }

                // 4. build values
                if (stmt['/assign']) {
                    scope.trace.step('/assign');
                    scope.values = {
                        ...scope.values,
                        ...scope.evalObject(stmt['/assign'] || {}),
                    };
                }

                return {};
            },
        },
    },
    'pkt-statement': {
        ['/if']: {
            name: '/if',
            order: 0,
            handler: (runtime: IRuntime, scope: IScope, stmt: any, next: any): PkStatementResult =>
                scope.evalObject(stmt['/if']) ? next(scope) : {},
        },
        ['/unless']: {
            name: '/unless',
            order: 1,
            handler: (runtime: IRuntime, scope: IScope, stmt: any, next: any): PkStatementResult =>
                scope.evalObject(stmt['/unless']) ? {} : next(scope),
        },
        ['/endIf']: {
            name: '/endIf',
            order: 3,
            handler: (runtime: IRuntime, scope: IScope, stmt: any, next: any): PkStatementResult =>
                scope.evalObject(stmt['/endIf']) ? { exit: true } : {},
        },
        ['/end']: {
            name: '/end',
            order: 4,
            handler: (runtime: IRuntime, scope: IScope, stmt: any, next: any): PkStatementResult => ({ exit: true }),
        },
        ['/select']: {
            name: '/select',
            order: 10,
            handler: (runtime: IRuntime, scope: IScope, stmt: any, next: any): PkStatementResult => {
                const predicate = selectors.compile(stmt['/select']);
                const objects = scope.objects.filter(predicate);
                const rst = scope.child({ objects }, cscope => {
                    return next(cscope);
                });
                if (rst.exit) {
                    return rst;
                }
                return {};
            },
        },
        ['/foreach']: {
            name: '/foreach',
            order: 100,
            handler: (runtime: IRuntime, scope: IScope, stmt: any, next: any): PkStatementResult => {
                scope.trace.into(() => {
                    scope.objects.forEach((o, i) => {
                        scope.trace.step(i);
                        scope.object = o;
                        scope.eval(stmt['/foreach']);
                    });
                });
                delete scope.object;
                return {};
            },
        },
        ['/values']: {
            name: '/values',
            order: 100,
            handler: (runtime: IRuntime, scope: IScope, stmt: any, next: any): PkStatementResult => {
                scope.defineValues(stmt['/values'] || {});
                return {};
            },
        },
        ['/assign']: {
            name: '/assign',
            order: 100,
            handler: (runtime: IRuntime, scope: IScope, stmt: any, next: any): PkStatementResult => {
                const values = scope.evalObject(stmt['/assign'] || {});
                for (const key of Object.keys(values)) {
                    if (key in scope.values) {
                        scope.values[key] = values[key];
                    } else {
                        const msg = `value ${key} is not defined`;
                        throw pktError(scope, new Error(msg), msg);
                    }
                }
                return {};
            },
        },
        ['/exit']: {
            name: '/exit',
            order: 100,
            handler: (runtime: IRuntime, scope: IScope, stmt: any, next: any): PkStatementResult => {
                const value = scope.evalObject(stmt['/exit']);
                if (value) {
                    return { exit: true };
                } else {
                    return {};
                }
            },
        },
        ['/add']: {
            name: '/add',
            order: 100,
            handler: (runtime: IRuntime, scope: IScope, stmt: any, next: any): PkStatementResult => {
                const object = scope.evalObject(stmt['/add']);
                scope.add(object);
                return {};
            },
        },
        ['/script']: {
            name: '/script',
            order: 100,
            handler: (runtime: IRuntime, scope: IScope, stmt: any, next: any): PkStatementResult => {
                scope.eval(stmt['/script']);
                return {};
            },
        },

        ['/template']: {
            name: '/template',
            order: 100,
            handler: (runtime: IRuntime, scope: IScope, stmt: any, next: any): PkStatementResult => {
                const objects = scope.evalTemplateAll(stmt['/template']);
                objects.forEach(object => scope.add(object));
                return {};
            },
        },
        ['/include']: {
            name: '/include',
            order: 100,
            handler: (runtime: IRuntime, scope: IScope, stmt: any, next: any): PkStatementResult => {
                const rpath = stmt['/include'];
                if (rpath.toLowerCase().endsWith('.pkt')) {
                    const { uri, data } = scope.loadPkt(rpath);
                    runtime.execute(scope, { uri, file: data }, 'pkt:/pkt');
                } else {
                    const { data } = scope.loadText(rpath);
                    const objects = scope.evalTemplateAll(data);
                    objects.forEach(object => scope.add(object));
                }
                return {};
            },
        },
        ['/apply']: {
            name: '/apply',
            order: 100,
            handler: (runtime: IRuntime, scope: IScope, stmt: any, next: any): PkStatementResult => {
                const rpath = stmt['/apply'];
                Runtime.Run(scope, rpath);
                return {};
            },
        },
        ['/jsonpath']: {
            name: '/jsonpath',
            mandotories: [],
            optionals: ['.apply', '.merge', '.exec'],
            handler: (runtime: IRuntime, scope: IScope, stmt: any, next: any): PkStatementResult => {
                const query = stmt['/jsonpath'];
                const apply = stmt['.apply'];
                const merge = stmt['.merge'];
                const exec = stmt['.exec'];

                const jsonpath = getJsonPath();
                scope.trace.into(() => {
                    scope.objects.forEach((o, i) => {
                        scope.trace.step(i);
                        const nodes = jsonpath.nodes(o, query);
                        nodes.forEach((node: any) => {
                            scope.child({}, cscope => {
                                cscope.object = o;
                                cscope.value = node.value;
                                if (apply) {
                                    const value = cscope.evalObject(apply);
                                    jsonpath.apply(o, jsonpath.stringify(node.path), () => value);
                                }
                                if (merge) {
                                    const value = cscope.evalObject(merge);
                                    const merged = { ...node.value, ...value };
                                    jsonpath.apply(o, jsonpath.stringify(node.path), () => merged);
                                }
                                if (exec) {
                                    cscope.eval(exec);
                                }
                            });
                        })
                    });
                });
                return {};
            },
        },
        ['/jsonpatch']: {
            name: '/jsonpatch',
            order: 100,
            handler: (runtime: IRuntime, scope: IScope, stmt: any, next: any): PkStatementResult => {

                const jsonpatch = getJsonPatch();
                const patch = Array.isArray(stmt['/jsonpatch']) ? stmt['/jsonpatch'] : [stmt['/jsonpatch']];
                scope.trace.into(() => {
                    scope.objects.forEach((o, i) => {
                        scope.trace.step(i);
                        scope.object = o;
                        const p = scope.evalObject(patch);
                        jsonpatch.apply(o, p);
                        delete scope.object;
                    });
                });
                delete scope.object;
                return {};
            },
        },
        ['/routine']: {
            name: '/routine',
            order: 100,
            handler: (runtime: IRuntime, scope: IScope, stmt: any, next: any): PkStatementResult => {
                scope.child({}, scope => {
                    const rst = runtime.execute(scope, stmt['/routine'], 'pkt-statement');
                    if (rst.exit) {
                        return rst;
                    }
                });

                return {};
            },
        },
        ['default']: {
            name: '/default',
            order: 5,
            handler: (runtime: IRuntime, scope: IScope, stmt: any, next: any): PkStatementResult => {
                if (!stmt) {
                    return {};
                }
                const o: any = {};
                Object.keys(stmt)
                    .filter(k => k.length == 0 || k[0] !== '/')
                    .forEach(k => o[k] = stmt[k]);
                if (Object.keys(o).length != 0) {
                    const object = scope.evalObject(o);
                    if (object) {
                        scope.add(object);
                    }
                }
                return {};
            },

        }
    },
};

export const languageSpec = pktLanguage;
