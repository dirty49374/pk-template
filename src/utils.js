const _ = require('underscore');

_.templateSettings = {
    interpolate: /\<\<\<\=(.+?)\>\>\>/g,
    evaluate: /\<\<\<\_(.+?)\>\>\>/g,
};

const pktError = (scope, error, message) => {
    error.summary = message;
    error.uri = scope ? scope.uri : '.';
    return error;
}

class JavaScriptCode {
    constructor(type, code) {
        this.type = type;
        this.code = code;
    }
}

const parseKvps = value => {
    if (!value) return {};
    const kvps = {};
    value.split(';')
        .forEach(kvp => {
            const [ key, value ] = kvp.split('=');
            kvps[key.trim()] = value.trim();
        });
    return kvps;
}

const parseList = value => {
    if (!value) return [];
    return value.split(';').map(p => p.trim());
}

module.exports = { pktError, JavaScriptCode, parseKvps, parseList };
