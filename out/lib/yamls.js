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
const js_yaml_1 = __importDefault(require("js-yaml"));
const livescript_1 = __importDefault(require("livescript"));
const coffeescript_1 = __importDefault(require("coffeescript"));
const utils = __importStar(require("./utils"));
const createCustomTag = (name, compile) => {
    return new js_yaml_1.default.Type(`!${name}`, {
        kind: 'scalar',
        resolve: (data) => typeof data === 'string' ||
            typeof data === 'number' ||
            typeof data === null,
        construct: (data) => {
            const compiled = compile(data);
            return new utils.CustomYamlTag(compiled.type, compiled.code);
        },
        instanceOf: utils.CustomYamlTag,
        represent: (jsCode) => `!${name} ${jsCode.code}`
    });
};
const PKT_SCHEMA = js_yaml_1.default.Schema.create([
    createCustomTag('cs', (data) => ({ type: 'js', code: coffeescript_1.default.compile(data, { bare: true }) })),
    createCustomTag('coffeeScript', (data) => ({ type: 'js', code: coffeescript_1.default.compile(data, { bare: true }) })),
    createCustomTag('ls', (data) => ({ type: 'js', code: livescript_1.default.compile(data, { bare: true }) })),
    createCustomTag('liveScript', (data) => ({ type: 'js', code: livescript_1.default.compile(data, { bare: true }) })),
    createCustomTag('js', (data) => ({ type: 'js', code: data })),
    createCustomTag('javaScript', (data) => ({ type: 'js', code: data })),
    createCustomTag('file', (data) => ({ type: 'file', code: data })),
]);
const pktYamlOption = { schema: PKT_SCHEMA };
exports.load = (text) => js_yaml_1.default.load(text);
exports.loadAll = (text) => js_yaml_1.default.loadAll(text);
exports.loadAsPkt = (text) => js_yaml_1.default.load(text, pktYamlOption);
