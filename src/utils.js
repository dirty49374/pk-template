const _ = require('underscore');

_.templateSettings = {
    interpolate: /\<\<\<\=(.+?)\>\>\>/g,
    evaluate: /\<\<\<\_(.+?)\>\>\>/g,
};

const pktError = (scope, error, message) => {
    error.summary = message;
    error.uri = scope.uri;
    return error;
}

class JavaScriptCode {
    constructor(code) {
        this.code = code;
    }
}

module.exports = { pktError, JavaScriptCode };
