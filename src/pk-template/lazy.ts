
let _livescript: any = null;
export function getLiveScript() {
    return _livescript || (_livescript = require('livescript'));
}

let _coffeescript: any = null;
export function getCoffeeScript() {
    return _coffeescript || (_coffeescript = require('coffeescript'));
}

let _jsonpath: any = null;
export function getJsonPath() {
    return _jsonpath || (_jsonpath = require('jsonpath'));
}

let _jsonPatch: any = null;
export function getJsonPatch() {
    return _jsonPatch || (_jsonPatch = require('json-patch'));
}

let _diff: any = null;
export function getDiff() {
    return _diff || (_diff = require('diff'));
}

let _syncRequest: any = null;
export function getSyncRequest() {
    return _syncRequest || (_syncRequest = require('sync-request'));
}

let _readlineSync: any = null;
export function getReadlineSync() {
    return _readlineSync || (_readlineSync = require('readline-sync'));
}

let _chalk: any = null;
export function getChalk() {
    return _chalk || (_chalk = require('chalk'));
}

let _sourceMap: any = null;
export function getSourceMap(): any {
    return _sourceMap || (_sourceMap = require('source-map'));
}

let _underscore: any = null;
export function getUnderscore() {
    if (_underscore) {
        return _underscore;
    }
    _underscore = require('underscore');
    _underscore.templateSettings = {
        interpolate: /\<\<\<\=(.+?)\>\>\>/g,
        evaluate: /\<\<\<\_(.+?)\>\>\>/g,
    };

    return _underscore;
}

let _ajv: any = null;
export function getAjv() {
    if (_ajv) {
        return _ajv;
    }
    const Ajv = require("ajv");
    _ajv = new Ajv({ allErrors: true });
    return _ajv;
}
