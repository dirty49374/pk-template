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
const underscore_1 = __importDefault(require("underscore"));
const livescript_1 = __importDefault(require("livescript"));
const coffeescript_1 = __importDefault(require("coffeescript"));
const utils = __importStar(require("./utils"));
const yamls = __importStar(require("./yamls"));
const loaders_1 = __importDefault(require("./loaders"));
const evalWithValues = require('./eval');
const evaluators = {
    eval(scope, script) {
        const $ = Object.assign({}, scope, scope.$buildLib(scope));
        return evalWithValues($, script, scope.values);
    },
    deep(scope, object) {
        if (object instanceof utils.JavaScriptCode) {
            return evaluators.javaScriptCode(scope, object);
        }
        if (Array.isArray(object)) {
            return object.map(item => evaluators.deep(scope, item));
        }
        if (typeof object === 'object') {
            if (object === null)
                return object;
            const clone = {};
            Object.keys(object)
                .forEach(key => clone[key] = evaluators.deep(scope, object[key]));
            return clone;
        }
        return object;
    },
    javaScript(scope, javascript) {
        return evaluators.eval(scope, javascript);
    },
    javaScriptCode(scope, code) {
        switch (code.type) {
            case 'js':
                return evaluators.javaScript(scope, code.code);
            case 'file':
                const uri = scope.resolve(code.code);
                return loaders_1.default.text(scope, uri);
        }
    },
    coffeeScript(scope, coffeescript) {
        const javascript = coffeescript_1.default.compile(coffeescript, { bare: true });
        return evaluators.javaScript(scope, javascript);
    },
    liveScript(scope, livescript) {
        const javascript = livescript_1.default.compile(livescript + '\n', { bare: true });
        return evaluators.javaScript(scope, javascript);
    },
    script(scope, script) {
        try {
            if (script instanceof utils.JavaScriptCode)
                return evaluators.javaScriptCode(scope, script);
            return evaluators.liveScript(scope, script);
        }
        catch (e) {
            throw utils.pktError(scope, e, `failed to evalute`);
        }
    },
    template(scope, text) {
        try {
            const tpl = underscore_1.default.template(text);
            const yaml = tpl(Object.assign({}, scope.values, { $: scope }));
            const objects = yamls.loadAll(yaml);
            return objects;
        }
        catch (e) {
            throw utils.pktError(scope, e, 'failed to parse template');
        }
    },
};
exports.default = evaluators;
