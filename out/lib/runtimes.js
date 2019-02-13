"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const ajv_1 = __importDefault(require("ajv"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const jsonpath_1 = __importDefault(require("jsonpath"));
const json_patch_1 = __importDefault(require("json-patch"));
const utils = __importStar(require("./utils"));
const scopes_1 = __importDefault(require("./scopes"));
const loaders_1 = __importDefault(require("./loaders"));
const selectors_1 = __importDefault(require("./selectors"));
const evaluators_1 = __importDefault(require("./evaluators"));
const ajv = new ajv_1.default({ allErrors: true });
const runtimes = {
    statements: {
        break(scope, statement) {
            if (!statement.break)
                return false;
            return true;
        },
        script(scope, statement) {
            if (!statement.script)
                return false;
            evaluators_1.default.script(scope, statement.script);
            return true;
        },
        each(scope, statement) {
            if (!statement.each)
                return false;
            scope.objects.forEach(o => {
                scope.object = o;
                evaluators_1.default.script(scope, statement.each);
            });
            delete scope.object;
            return true;
        },
        assign(scope, statement) {
            if (!statement.assign)
                return false;
            const values = typeof statement.assign == 'string'
                ? utils.parseKvps(statement.assign)
                : evaluators_1.default.deep(scope, statement.assign || {});
            scope.values = Object.assign({}, scope.values, values);
            return true;
        },
        add(scope, statement) {
            if (!statement.add)
                return false;
            const object = evaluators_1.default.deep(scope, statement.add);
            scope.add(object);
            return true;
        },
        include(scope, statement) {
            if (!statement.include)
                return false;
            const uri = scope.resolve(statement.include);
            if (uri.toLowerCase().endsWith(".pkt")) {
                const file = loaders_1.default.pkt(scope, uri);
                runtimes.run(file, scope, uri);
            }
            else {
                const tpl = loaders_1.default.text(scope, uri);
                const objects = evaluators_1.default.template(scope, tpl);
                objects.forEach(object => scope.add(object));
            }
            return true;
        },
        includeWith(scope, statement) {
            if (!statement.includeWith)
                return false;
            const idx = statement.includeWith.indexOf(' ');
            const path = idx >= 0
                ? statement.includeWith.substring(0, idx)
                : statement.includeWith;
            const kvps = idx >= 0
                ? statement.includeWith.substring(idx)
                : "";
            const values = utils.parseKvps(kvps);
            scope.child({}, (cscope) => {
                cscope.values = Object.assign({}, scope.values, values);
                const uri = scope.resolve(path);
                if (uri.toLowerCase().endsWith(".pkt")) {
                    const file = loaders_1.default.pkt(cscope, uri);
                    runtimes.run(file, cscope, uri);
                }
                else {
                    const tpl = loaders_1.default.text(cscope, uri);
                    const objects = evaluators_1.default.template(cscope, tpl);
                    objects.forEach(object => cscope.add(object));
                }
            });
            return true;
        },
        jsonpath(scope, statement) {
            if (!statement.jsonpath)
                return false;
            scope.objects.forEach(o => {
                const nodes = jsonpath_1.default.nodes(o, statement.jsonpath.query);
                nodes.forEach(node => {
                    scope.child({}, cscope => {
                        cscope.object = o;
                        // XXX: ??
                        // cscope.path = node.path;
                        // cscope.value = node.value;
                        if (statement.jsonpath.apply) {
                            const value = evaluators_1.default.deep(cscope, statement.jsonpath.apply);
                            jsonpath_1.default.apply(o, jsonpath_1.default.stringify(node.path), () => value);
                        }
                        if (statement.jsonpath.merge) {
                            const value = evaluators_1.default.deep(cscope, statement.jsonpath.merge);
                            const merged = Object.assign({}, node.value, value);
                            jsonpath_1.default.apply(o, jsonpath_1.default.stringify(node.path), () => merged);
                        }
                        if (statement.jsonpath.exec) {
                            evaluators_1.default.script(cscope, statement.jsonpath.exec);
                        }
                    });
                });
            });
        },
        apply(scope, statement) {
            if (!statement.apply)
                return false;
            const uri = scope.resolve(statement.apply);
            if (uri.toLowerCase().endsWith(".pkt")) {
                const file = loaders_1.default.pkt(scope, uri);
                runtimes.run(file, scope, uri, true);
            }
            else {
                const tpl = loaders_1.default.text(scope, uri);
                const objects = evaluators_1.default.template(scope, tpl);
                scope.objects.push(...objects);
            }
            return true;
        },
        applyWith(scope, statement) {
            if (!statement.applyWith)
                return false;
            const idx = statement.applyWith.indexOf(' ');
            const path = idx >= 0
                ? statement.applyWith.substring(0, idx)
                : statement.applyWith;
            const kvps = idx >= 0
                ? statement.applyWith.substring(idx)
                : "";
            const values = utils.parseKvps(kvps);
            scope.child({ objects: scope.objects }, cscope => {
                cscope.values = Object.assign({}, scope.values, values);
                const uri = scope.resolve(path);
                if (uri.toLowerCase().endsWith(".pkt")) {
                    const file = loaders_1.default.pkt(cscope, uri);
                    runtimes.run(file, cscope, uri, true);
                }
                else {
                    const tpl = loaders_1.default.text(cscope, uri);
                    const objects = evaluators_1.default.template(cscope, tpl);
                    cscope.objects.push(...objects);
                }
            });
            return true;
        },
        patch(scope, statement) {
            if (!statement.patch)
                return false;
            const patch = Array.isArray(statement.patch) ? statement.patch : [statement.patch];
            scope.objects.forEach(o => {
                scope.object = o;
                const p = evaluators_1.default.deep(scope, patch);
                json_patch_1.default.apply(o, p);
                delete scope.object;
            });
            delete scope.object;
            return true;
        },
        routine(parentScope, statement) {
            if (!statement.routine)
                return false;
            parentScope.child({}, scope => {
                runtimes.routine(scope, statement.routine);
            });
            return true;
        },
        routineWith(parentScope, statement) {
            if (!statement.routineWith)
                return false;
            parentScope.child({ objects: parentScope.objects }, scope => {
                runtimes.routine(scope, statement.routineWith);
            });
            return true;
        },
        kubeconfig(scope, statement) {
            if (!statement.kubeconfig)
                return false;
            scope.userdata.kubeconfig = evaluators_1.default.deep(scope, statement.kubeconfig);
            return true;
        },
        template(scope, statement) {
            if (!statement.template)
                return false;
            const objects = evaluators_1.default.template(scope, statement.template);
            objects.forEach(object => scope.add(object));
            return true;
        },
    },
    statement(scope, statement) {
        runtimes.statements.each(scope, statement);
        runtimes.statements.jsonpath(scope, statement);
        runtimes.statements.script(scope, statement);
        runtimes.statements.assign(scope, statement);
        runtimes.statements.include(scope, statement);
        runtimes.statements.includeWith(scope, statement);
        runtimes.statements.apply(scope, statement);
        runtimes.statements.applyWith(scope, statement);
        runtimes.statements.add(scope, statement);
        runtimes.statements.patch(scope, statement);
        runtimes.statements.template(scope, statement);
        runtimes.statements.kubeconfig(scope, statement);
        runtimes.statements.routine(scope, statement);
        runtimes.statements.routineWith(scope, statement);
    },
    routine(scope, routine) {
        if (!routine)
            return;
        for (const statement of routine) {
            if (statement.if && !evaluators_1.default.script(scope, statement.if)) {
                continue;
            }
            if (statement.select) {
                const predicate = selectors_1.default.compile(statement.select);
                const objects = scope.objects.filter(predicate);
                scope.child({ objects, values: scope.values }, cscope => {
                    runtimes.statement(cscope, statement);
                });
            }
            else {
                runtimes.statement(scope, statement);
            }
            if (runtimes.statements.break(scope, statement))
                return;
        }
    },
    buildInput(input, parentValues) {
        if (!input)
            return {};
        const values = Object.assign({}, input);
        for (const k in parentValues) {
            if (k in values)
                values[k] = parentValues[k];
        }
        return values;
    },
    run(file, parentScope, uri, withObject = false) {
        if (!file)
            return;
        if (!parentScope)
            throw 'no parent scope';
        uri = uri || '.';
        parentScope.child({ uri }, scope => {
            // 1. bind objects
            if (withObject)
                scope.objects = [...parentScope.objects];
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
            scope.values = Object.assign({}, scope.values, evaluators_1.default.deep(scope, file.assign || {}));
            // 5. run routine
            runtimes.routine(scope, file.routine);
        });
        return parentScope.objects;
    },
    exec(objects, values, files, config, userdata) {
        const scope = scopes_1.default.create(values, '.', null, config, objects, userdata || {});
        files.forEach(path => runtimes.statements.apply(scope, { apply: path }));
        return scope.objects.map(o => js_yaml_1.default.dump(o)).join('---\n');
    }
};
module.exports = runtimes;
