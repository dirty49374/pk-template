import { IStatementSpecs, IRuntime, IScope, IPkStatementResult, IPkt } from "./types";
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
            handler: (runtime: IRuntime, scope: IScope, stmt: any): IPkStatementResult => {
                if (!stmt) return {};
                if (!scope) throw 'no parent scope';

                const uri = stmt.uri;
                const pkt = stmt.pkt as IPkt;
                const withObject = stmt.withObject;

                scope.trace.into(() => {
                    const values = JSON.parse(JSON.stringify(scope.values));
                    scope.child({ uri, values }, cscope => {
                        if (withObject) {
                            cscope.objects = [...scope.objects];
                        }

                        cscope.trace.step('header');
                        const rst = runtime.execute(cscope, pkt.header, 'pkt:/pkt-header');
                        if (rst.exit) {
                            return {};
                        }

                        for (let i = 0; i < pkt.statements.length; ++i) {
                            cscope.trace.step(i);
                            const rst = runtime.execute(cscope, pkt.statements[i], 'pkt-statement');
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
            handler: (runtime: IRuntime, scope: IScope, stmt: any): IPkStatementResult => {
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
                        throw scope.error('property validation failed');
                    }
                }

                // 4. build values
                if (stmt['/values']) {
                    throw scope.error('header cannot have /values statement');
                    // scope.trace.step('/values');
                    // scope.values = {
                    //     ...scope.values,
                    //     ...scope.evalObject(stmt['/values'] || {}),
                    // };
                }

                // 4. build values
                if (stmt['/assign']) {
                    throw scope.error('header cannot have /assign statement');
                    // scope.trace.step('/assign');
                    // scope.values = {
                    //     ...scope.values,
                    //     ...scope.evalObject(stmt['/assign'] || {}),
                    // };
                }

                return {};
            },
        },
    },
    'pkt-statement': {
        ['/if']: {
            name: '/if',
            order: 0,
            handler: (runtime: IRuntime, scope: IScope, stmt: any, next: any): IPkStatementResult =>
                scope.evalObject(stmt['/if']) ? next(scope) : {},
        },
        ['/unless']: {
            name: '/unless',
            order: 1,
            handler: (runtime: IRuntime, scope: IScope, stmt: any, next: any): IPkStatementResult =>
                scope.evalObject(stmt['/unless']) ? {} : next(scope),
        },
        ['/endIf']: {
            name: '/endIf',
            order: 3,
            handler: (runtime: IRuntime, scope: IScope, stmt: any, next: any): IPkStatementResult =>
                scope.evalObject(stmt['/endIf']) ? { exit: true } : {},
        },
        ['/end']: {
            name: '/end',
            order: 4,
            handler: (runtime: IRuntime, scope: IScope, stmt: any, next: any): IPkStatementResult => ({ exit: true }),
        },
        ['/select']: {
            name: '/select',
            order: 10,
            handler: (runtime: IRuntime, scope: IScope, stmt: any, next: any): IPkStatementResult => {
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
            handler: (runtime: IRuntime, scope: IScope, stmt: any, next: any): IPkStatementResult => {
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
            handler: (runtime: IRuntime, scope: IScope, stmt: any, next: any): IPkStatementResult => {
                scope.defineValues(stmt['/values'] || {});
                return {};
            },
        },
        ['/assign']: {
            name: '/assign',
            order: 100,
            handler: (runtime: IRuntime, scope: IScope, stmt: any, next: any): IPkStatementResult => {
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
            handler: (runtime: IRuntime, scope: IScope, stmt: any, next: any): IPkStatementResult => {
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
            handler: (runtime: IRuntime, scope: IScope, stmt: any, next: any): IPkStatementResult => {
                const object = scope.evalObject(stmt['/add']);
                scope.add(object);
                return {};
            },
        },
        ['/script']: {
            name: '/script',
            order: 100,
            handler: (runtime: IRuntime, scope: IScope, stmt: any, next: any): IPkStatementResult => {
                scope.eval(stmt['/script']);
                return {};
            },
        },

        ['/template']: {
            name: '/template',
            order: 100,
            handler: (runtime: IRuntime, scope: IScope, stmt: any, next: any): IPkStatementResult => {
                const objects = scope.evalTemplateAll(stmt['/template']);
                objects.forEach(object => scope.add(object));
                return {};
            },
        },
        ['/include']: {
            name: '/include',
            order: 100,
            handler: (runtime: IRuntime, scope: IScope, stmt: any, next: any): IPkStatementResult => {
                const rpath = stmt['/include'];
                const _with = stmt['/with'] || {};
                const { uri, data } = scope.loadPkt(rpath);
                if (data.header['/properties']) {
                    const undefinedKey = Object.keys(_with).find(k => !(k in data.header['/properties']));
                    if (undefinedKey) {
                        throw new Error(`${undefinedKey} is not defined at ${uri}`);
                    }
                }
                scope.child({ objects: scope.objects }, cscope => {
                    cscope.defineValues(_with);
                    runtime.execute(cscope, { uri, pkt: data, withObject: false }, 'pkt:/pkt');
                });
                return {};
            },
        },
        ['/apply']: {
            name: '/apply',
            order: 100,
            handler: (runtime: IRuntime, scope: IScope, stmt: any, next: any): IPkStatementResult => {
                const rpath = stmt['/apply'];
                const _with = stmt['/with'] || {};
                const { uri, data } = scope.loadPkt(rpath);
                if (data.header['/properties']) {
                    const undefinedKey = Object.keys(_with).find(k => !(k in data.header['/properties']));
                    if (undefinedKey) {
                        throw new Error(`${undefinedKey} is not defined at ${uri}`);
                    }
                }
                scope.child({ objects: scope.objects }, cscope => {
                    cscope.defineValues(_with);
                    runtime.execute(cscope, { uri, pkt: data, withObject: true }, 'pkt:/pkt');
                });
                return {};
            },
        },
        ['/jsonpath']: {
            name: '/jsonpath',
            mandotories: [],
            optionals: ['.apply', '.merge', '.exec'],
            handler: (runtime: IRuntime, scope: IScope, stmt: any, next: any): IPkStatementResult => {
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
            handler: (runtime: IRuntime, scope: IScope, stmt: any, next: any): IPkStatementResult => {

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
            handler: (runtime: IRuntime, scope: IScope, stmt: any, next: any): IPkStatementResult => {
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
            handler: (runtime: IRuntime, scope: IScope, stmt: any, next: any): IPkStatementResult => {
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
