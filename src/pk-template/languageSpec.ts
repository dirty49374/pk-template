import { IScope, IValues, IPkStatementResult, IPkt, ILanguageSpec, ILanguageVm, IPktHeader } from "./types";
import { getJsonPath, getJsonPatch, getUnderscore } from "../lazy";
import { pktError, setValue } from "./utils";
import { StyleSheet } from './styles/styleSheet';
import { JsonSchema } from "./jsonSchema";
import selectors from "./selectors";
import { parseYamlAsPkt, parseYamlAll } from "../pk-yaml";
import jslib from "./jslib";
import { forEachTreeObjectKey } from "../common";
import { CustomYamlTag } from "../pk-yaml/customTags";

export class PktRuntime {
    buildProperties(properties: any, parentValues: IValues): any {
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


    private checkStrictCheckedValues(header: IPktHeader, strictValues: IValues, uri: string) {
        if (header['/properties']) {
            const undefinedValue = Object.keys(strictValues)
                .find(k => !(k in header['/properties']));
            if (undefinedValue) {
                throw new Error(`${undefinedValue} is not defined at ${uri}`);
            }
        }
    }

    executeFile(vm: ILanguageVm<PktRuntime>, scope: IScope, rpath: string, strictValues: IValues) {
        if (rpath.toLowerCase().endsWith('.pkt')) {
            const { uri, data } = scope.loadPkt(rpath);
            this.checkStrictCheckedValues(data.header, strictValues, uri);

            scope.child({ objects: scope.objects }, (cscope: IScope) => {
                const evaluatedValues = strictValues ? this.evalObject(vm, scope, strictValues) : {};
                cscope.defineValues(evaluatedValues);
                vm.execute(cscope, { uri, pkt: data, withObject: false }, 'pkt:/pkt');
            });
        } else {
            const { data } = scope.loadText(rpath);
            scope.child({ objects: scope.objects }, (cscope: IScope) => {
                const evaluatedValues = strictValues ? this.evalObject(vm, scope, strictValues) : {};
                cscope.defineValues(evaluatedValues);
                vm.runtime.evalTemplateAll(vm, cscope, data)
                    .filter(o => o)
                    .forEach(o => cscope.add(o));
            });
        }
    }

    expandStyleSheet(vm: ILanguageVm<PktRuntime>, scope: IScope, object: any): void {
        this.expandStyle(vm, scope, object);
    }

    // style
    expandStyle = (vm: ILanguageVm<PktRuntime>, scope: IScope, object: any): void =>
        scope.styleSheet.apply(vm, scope, object);

    expandCaretPath(object: any) {
        forEachTreeObjectKey(object, (node: any, key: string, value: any) => {
            if (key.startsWith('^') && key.length > 1) {
                delete node[key];
                setValue(node, key.substr(1), value);
            }
        });
    }

    evalAllCustomTags(vm: ILanguageVm<PktRuntime>, scope: IScope, node: any): any {
        if (node instanceof CustomYamlTag) {
            return vm.eval(node, scope);
        } else if (Array.isArray(node)) {
            return node.map(item => this.evalAllCustomTags(vm, scope, item));
        } else if (typeof node === 'object') {
            if (node === null) return node;

            const clone: any = {};
            Object.keys(node)
                .forEach((key: string) => clone[key] = this.evalAllCustomTags(vm, scope, node[key]));
            return clone;
        }
        return node;
    }

    deleteUndefined(node: any) {
        if (node === undefined) {
            return;
        }
        if (Array.isArray(node)) {
            for (let i = node.length - 1; i >= 0; --i) {
                const val = node[i];
                if (val === undefined) {
                    node.splice(i, 1);
                } else {
                    this.deleteUndefined(node[i]);
                }
            }
        } else if (typeof node === 'object') {
            if (node === null) return node;
            Object.keys(node)
                .forEach((key: string) => {
                    const val = node[key];
                    if (val === undefined) {
                        delete node[key];
                    } else {
                        this.deleteUndefined(node[key]);
                    }
                });
        }
    }

    evalObject(vm: ILanguageVm<PktRuntime>, scope: IScope, object: any): any {
        object = this.evalAllCustomTags(vm, scope, object);
        this.expandCaretPath(object);
        this.expandStyleSheet(vm, scope, object);
        this.deleteUndefined(object);

        return object;
    }

    // evaluater
    evalTemplate(vm: ILanguageVm<PktRuntime>, scope: IScope, tpl: string): string {
        const _ = getUnderscore();
        return _.template(tpl)(vm.sandbox(scope));
    }
    evalTemplateAll(vm: ILanguageVm<PktRuntime>, scope: IScope, text: string): any[] {
        try {
            const tpl = getUnderscore().template(text);
            const yaml = tpl(vm.sandbox(scope));
            const objects = parseYamlAll(yaml);
            return objects;
        } catch (e) {
            throw scope.error('failed to parse template', e);
        }
    }
}

const pktLanguage: ILanguageSpec<PktRuntime> = {
    createRuntime() {
        return new PktRuntime();
    },
    compile(scope: IScope, src: string, uri: string): any {
        const doCompile = (scope: IScope, src: string, uri: string): any => {
            try {
                const yamls = parseYamlAsPkt(src, uri);
                if (yamls.length == 0) {
                    return { header: {}, statements: [] };
                }
                if (yamls[0]['/properties'] || yamls[0]['/schema']) {
                    const header = yamls[0];
                    return { header, statements: yamls.slice(1) };
                }
                return { header: {}, statements: yamls };
            } catch (e) {
                throw scope.error(`failed to parse yaml ${uri}`, e);
            }
        }
        return {
            uri,
            pkt: doCompile(scope, src, uri),
            withObject: true,
        }
    },
    sandbox(scope: IScope, values?: IValues): any {
        const $ = values
            ? { ...scope, ...jslib(scope), ...values }
            : { ...scope, ...jslib(scope) };
        const sandbox = { $, console, Buffer, ...scope.values };
        return sandbox;
    },
    initialState: 'pkt:/pkt',
    states: {
        'pkt': {
            ['/pkt']: {
                name: '/pkt',
                order: 100,
                handler: (vm: ILanguageVm<PktRuntime>, scope: IScope, stmt: any): IPkStatementResult => {
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
                            const rst = vm.execute(cscope, pkt.header, 'pkt:/pkt-header');
                            if (rst.exit) {
                                return {};
                            }

                            for (let i = 0; i < pkt.statements.length; ++i) {
                                cscope.trace.step(i);
                                const rst = vm.execute(cscope, pkt.statements[i], 'pkt-statement');
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
                handler: (vm: ILanguageVm<PktRuntime>, scope: IScope, stmt: any): IPkStatementResult => {
                    // 0. style sheets
                    scope.trace.step('/stylesheet');
                    scope.styleSheet = StyleSheet.Build(scope, stmt);

                    // 2. build properties
                    scope.trace.step('/properties');
                    if (stmt['/properties']) {
                        scope.values = vm.runtime.buildProperties(stmt['/properties'], scope.values);
                    }

                    // 3. validate schema
                    if (stmt['/schema']) {
                        scope.trace.step('schema');
                        const schema = new JsonSchema(stmt['/schema']);
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
                handler: (vm: ILanguageVm<PktRuntime>, scope: IScope, stmt: any, next: any): IPkStatementResult =>
                    vm.runtime.evalObject(vm, scope, stmt['/if']) ? next(scope) : {},
            },
            ['/unless']: {
                name: '/unless',
                order: 1,
                handler: (vm: ILanguageVm<PktRuntime>, scope: IScope, stmt: any, next: any): IPkStatementResult =>
                    vm.runtime.evalObject(vm, scope, stmt['/unless']) ? {} : next(scope),
            },
            ['/endIf']: {
                name: '/endIf',
                order: 3,
                handler: (vm: ILanguageVm<PktRuntime>, scope: IScope, stmt: any): IPkStatementResult =>
                    vm.runtime.evalObject(vm, scope, stmt['/endIf']) ? { exit: true } : {},
            },
            ['/end']: {
                name: '/end',
                order: 4,
                handler: (): IPkStatementResult => ({ exit: true }),
            },
            ['/select']: {
                name: '/select',
                order: 10,
                handler: (vm: ILanguageVm<PktRuntime>, scope: IScope, stmt: any, next: any): IPkStatementResult => {
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
                handler: (vm: ILanguageVm<PktRuntime>, scope: IScope, stmt: any): IPkStatementResult => {
                    scope.trace.into(() => {
                        scope.objects.forEach((o, i) => {
                            scope.trace.step(i);
                            scope.object = o;
                            vm.eval(stmt['/foreach'], scope);
                        });
                    });
                    delete scope.object;
                    return {};
                },
            },
            ['/values']: {
                name: '/values',
                order: 100,
                handler: (vm: ILanguageVm<PktRuntime>, scope: IScope, stmt: any): IPkStatementResult => {
                    const evaluatedValues = vm.runtime.evalObject(vm, scope, stmt['/values'] || {});
                    scope.defineValues(evaluatedValues);
                    return {};
                },
            },
            ['/assign']: {
                name: '/assign',
                order: 100,
                handler: (vm: ILanguageVm<PktRuntime>, scope: IScope, stmt: any): IPkStatementResult => {
                    const values = vm.runtime.evalObject(vm, scope, stmt['/assign'] || {});
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
                handler: (vm: ILanguageVm<PktRuntime>, scope: IScope, stmt: any): IPkStatementResult => {
                    const value = vm.runtime.evalObject(vm, scope, stmt['/exit']);
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
                handler: (vm: ILanguageVm<PktRuntime>, scope: IScope, stmt: any): IPkStatementResult => {
                    const object = vm.runtime.evalObject(vm, scope, stmt['/add']);
                    scope.add(object);
                    return {};
                },
            },
            ['/script']: {
                name: '/script',
                order: 100,
                handler: (vm: ILanguageVm<PktRuntime>, scope: IScope, stmt: any): IPkStatementResult => {
                    vm.eval(stmt['/script'], scope);
                    return {};
                },
            },

            ['/template']: {
                name: '/template',
                order: 100,
                handler: (vm: ILanguageVm<PktRuntime>, scope: IScope, stmt: any): IPkStatementResult => {
                    const objects = vm.runtime.evalTemplateAll(vm, scope, stmt['/template']);
                    objects.forEach(object => scope.add(object));
                    return {};
                },
            },
            ['/include']: {
                name: '/include',
                order: 100,
                handler: (vm: ILanguageVm<PktRuntime>, scope: IScope, stmt: any): IPkStatementResult => {
                    const rpath = stmt['/include'];
                    const _with = stmt['/with'] || {};
                    scope.child({ objects: [] }, (cscope) => {
                        vm.runtime.executeFile(vm, cscope, rpath, _with);
                    })
                    return {};
                },
            },
            ['/apply']: {
                name: '/apply',
                order: 100,
                handler: (vm: ILanguageVm<PktRuntime>, scope: IScope, stmt: any): IPkStatementResult => {
                    const rpath = stmt['/apply'];
                    const _with = stmt['/with'] || {};
                    vm.runtime.executeFile(vm, scope, rpath, _with);
                    return {};
                },
            },
            ['/jsonpath']: {
                name: '/jsonpath',
                order: 100,
                handler: (vm: ILanguageVm<PktRuntime>, scope: IScope, stmt: any): IPkStatementResult => {
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
                                        const value = vm.runtime.evalObject(vm, scope, apply);
                                        jsonpath.apply(o, jsonpath.stringify(node.path), () => value);
                                    }
                                    if (merge) {
                                        const value = vm.runtime.evalObject(vm, scope, merge);
                                        const merged = { ...node.value, ...value };
                                        jsonpath.apply(o, jsonpath.stringify(node.path), () => merged);
                                    }
                                    if (exec) {
                                        vm.eval(exec, cscope);
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
                handler: (vm: ILanguageVm<PktRuntime>, scope: IScope, stmt: any): IPkStatementResult => {

                    const jsonpatch = getJsonPatch();
                    const patch = Array.isArray(stmt['/jsonpatch']) ? stmt['/jsonpatch'] : [stmt['/jsonpatch']];
                    scope.trace.into(() => {
                        scope.objects.forEach((o, i) => {
                            scope.trace.step(i);
                            scope.object = o;
                            const p = vm.runtime.evalObject(vm, scope, patch);
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
                handler: (vm: ILanguageVm<PktRuntime>, scope: IScope, stmt: any): IPkStatementResult => {
                    scope.child({}, scope => {
                        const rst = vm.execute(scope, stmt['/routine'], 'pkt-statement');
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
                handler: (vm: ILanguageVm<PktRuntime>, scope: IScope, stmt: any): IPkStatementResult => {
                    if (!stmt) {
                        return {};
                    }
                    const o: any = {};
                    Object.keys(stmt)
                        .filter(k => k.length == 0 || k[0] !== '/')
                        .forEach(k => o[k] = stmt[k]);
                    if (Object.keys(o).length != 0) {
                        const object = vm.runtime.evalObject(vm, scope, o);
                        if (object) {
                            scope.add(object);
                        }
                    }
                    return {};
                },

            }
        },
    },
};

export const languageSpec = pktLanguage;
