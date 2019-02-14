"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const underscore_1 = __importDefault(require("underscore"));
underscore_1.default.templateSettings = {
    interpolate: /\<\<\<\=(.+?)\>\>\>/g,
    evaluate: /\<\<\<\_(.+?)\>\>\>/g,
};
exports.pktError = (scope, error, message) => {
    const pe = error;
    pe.summary = message;
    pe.uri = scope ? scope.uri : '.';
    return pe;
};
class CustomYamlTag {
    constructor(type, code) {
        this.type = type;
        this.code = code;
    }
}
exports.CustomYamlTag = CustomYamlTag;
exports.parseKvps = (value) => {
    if (!value)
        return {};
    const kvps = {};
    value.split(';')
        .forEach(kvp => {
        const [key, value] = kvp.split('=');
        kvps[key.trim()] = value.trim();
    });
    return kvps;
};
exports.parseList = (value) => {
    if (!value)
        return [];
    return value.split(';').map(p => p.trim());
};
