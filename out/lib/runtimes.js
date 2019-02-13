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
const jsonpath_1 = __importDefault(require("jsonpath"));
const json_patch_1 = __importDefault(require("json-patch"));
const utils = __importStar(require("./utils"));
const scopes_1 = __importDefault(require("./scopes"));
const loaders = __importStar(require("./loaders"));
const selectors_1 = __importDefault(require("./selectors"));
const evaluators = __importStar(require("./evaluators"));
const ajv = new ajv_1.default({ allErrors: true });
const statements = {
    break(scope, stmt) {
        if (!stmt.break)
            return false;
        return true;
    },
    script(scope, stmt) {
        if (!stmt.script)
            return false;
        evaluators.script(scope, stmt.script);
        return true;
    },
    each(scope, stmt) {
        if (!stmt.each)
            return false;
        scope.objects.forEach(o => {
            scope.object = o;
            evaluators.script(scope, stmt.each);
        });
        delete scope.object;
        return true;
    },
    assign(scope, stmt) {
        if (!stmt.assign)
            return false;
        const values = typeof stmt.assign == 'string'
            ? utils.parseKvps(stmt.assign)
            : evaluators.deep(scope, stmt.assign || {});
        scope.values = Object.assign({}, scope.values, values);
        return true;
    },
    add(scope, stmt) {
        if (!stmt.add)
            return false;
        const object = evaluators.deep(scope, stmt.add);
        scope.add(object);
        return true;
    },
    include(scope, stmt) {
        if (!stmt.include)
            return false;
        const uri = scope.resolve(stmt.include);
        if (uri.toLowerCase().endsWith(".pkt")) {
            const file = loaders.pkt(scope, uri);
            run(file, scope, uri);
        }
        else {
            const tpl = loaders.loadText(scope, uri);
            const objects = evaluators.template(scope, tpl);
            objects.forEach(object => scope.add(object));
        }
        return true;
    },
    includeWith(scope, stmt) {
        if (!stmt.includeWith)
            return false;
        const idx = stmt.includeWith.indexOf(' ');
        const path = idx >= 0
            ? stmt.includeWith.substring(0, idx)
            : stmt.includeWith;
        const kvps = idx >= 0
            ? stmt.includeWith.substring(idx)
            : "";
        const values = utils.parseKvps(kvps);
        scope.child({}, (cscope) => {
            cscope.values = Object.assign({}, scope.values, values);
            const uri = scope.resolve(path);
            if (uri.toLowerCase().endsWith(".pkt")) {
                const file = loaders.pkt(cscope, uri);
                run(file, cscope, uri);
            }
            else {
                const tpl = loaders.loadText(cscope, uri);
                const objects = evaluators.template(cscope, tpl);
                objects.forEach(object => cscope.add(object));
            }
        });
        return true;
    },
    jsonpath(scope, stmt) {
        if (!stmt.jsonpath)
            return false;
        scope.objects.forEach(o => {
            const nodes = jsonpath_1.default.nodes(o, stmt.jsonpath.query);
            nodes.forEach(node => {
                scope.child({}, cscope => {
                    cscope.object = o;
                    // XXX: ??
                    // cscope.path = node.path;
                    // cscope.value = node.value;
                    if (stmt.jsonpath.apply) {
                        const value = evaluators.deep(cscope, stmt.jsonpath.apply);
                        jsonpath_1.default.apply(o, jsonpath_1.default.stringify(node.path), () => value);
                    }
                    if (stmt.jsonpath.merge) {
                        const value = evaluators.deep(cscope, stmt.jsonpath.merge);
                        const merged = Object.assign({}, node.value, value);
                        jsonpath_1.default.apply(o, jsonpath_1.default.stringify(node.path), () => merged);
                    }
                    if (stmt.jsonpath.exec) {
                        evaluators.script(cscope, stmt.jsonpath.exec);
                    }
                });
            });
        });
    },
    apply(scope, stmt) {
        if (!stmt.apply)
            return false;
        const uri = scope.resolve(stmt.apply);
        if (uri.toLowerCase().endsWith(".pkt")) {
            const file = loaders.pkt(scope, uri);
            run(file, scope, uri, true);
        }
        else {
            const tpl = loaders.loadText(scope, uri);
            const objects = evaluators.template(scope, tpl);
            scope.objects.push(...objects);
        }
        return true;
    },
    applyWith(scope, stmt) {
        if (!stmt.applyWith)
            return false;
        const idx = stmt.applyWith.indexOf(' ');
        const path = idx >= 0
            ? stmt.applyWith.substring(0, idx)
            : stmt.applyWith;
        const kvps = idx >= 0
            ? stmt.applyWith.substring(idx)
            : "";
        const values = utils.parseKvps(kvps);
        scope.child({ objects: scope.objects }, cscope => {
            cscope.values = Object.assign({}, scope.values, values);
            const uri = scope.resolve(path);
            if (uri.toLowerCase().endsWith(".pkt")) {
                const file = loaders.pkt(cscope, uri);
                run(file, cscope, uri, true);
            }
            else {
                const tpl = loaders.loadText(cscope, uri);
                const objects = evaluators.template(cscope, tpl);
                cscope.objects.push(...objects);
            }
        });
        return true;
    },
    patch(scope, stmt) {
        if (!stmt.patch)
            return false;
        const patch = Array.isArray(stmt.patch) ? stmt.patch : [stmt.patch];
        scope.objects.forEach(o => {
            scope.object = o;
            const p = evaluators.deep(scope, patch);
            json_patch_1.default.apply(o, p);
            delete scope.object;
        });
        delete scope.object;
        return true;
    },
    routine(parentScope, stmt) {
        if (!stmt.routine)
            return false;
        parentScope.child({}, scope => {
            routine(scope, stmt.routine);
        });
        return true;
    },
    routineWith(parentScope, stmt) {
        if (!stmt.routineWith)
            return false;
        parentScope.child({ objects: parentScope.objects }, scope => {
            routine(scope, stmt.routineWith);
        });
        return true;
    },
    kubeconfig(scope, stmt) {
        if (!stmt.kubeconfig)
            return false;
        scope.userdata.kubeconfig = evaluators.deep(scope, stmt.kubeconfig);
        return true;
    },
    template(scope, stmt) {
        if (!stmt.template)
            return false;
        const objects = evaluators.template(scope, stmt.template);
        objects.forEach(object => scope.add(object));
        return true;
    },
};
function statement(scope, stmt) {
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
exports.statement = statement;
function routine(scope, routine) {
    if (!routine)
        return;
    for (const stmt of routine) {
        if (stmt.if && !evaluators.script(scope, stmt.if)) {
            continue;
        }
        if (stmt.select) {
            const predicate = selectors_1.default.compile(stmt.select);
            const objects = scope.objects.filter(predicate);
            scope.child({ objects, values: scope.values }, cscope => {
                statement(cscope, stmt);
            });
        }
        else {
            statement(scope, stmt);
        }
        if (statements.break(scope, stmt))
            return;
    }
}
exports.routine = routine;
function buildInput(input, parentValues) {
    if (!input)
        return {};
    const values = Object.assign({}, input);
    for (const k in parentValues) {
        if (k in values)
            values[k] = parentValues[k];
    }
    return values;
}
exports.buildInput = buildInput;
function run(file, parentScope, uri, withObject = false) {
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
        scope.values = Object.assign({}, scope.values, evaluators.deep(scope, file.assign || {}));
        // 5. run routine
        routine(scope, file.routine);
    });
    return parentScope.objects;
}
exports.run = run;
function exec(objects, values, files, config, userdata) {
    const scope = scopes_1.default.create(values, '.', null, config, objects, userdata || {});
    files.forEach(path => statements.apply(scope, { apply: path }));
    return scope.objects;
}
exports.exec = exec;
