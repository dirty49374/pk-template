const _ = require('underscore');
const liveScript = require('livescript');
const coffeeScript = require('coffeescript');
const utils = require('./utils');
const yamls = require('./yamls');

const evaluators = {
    eval(scope, script) {
        const $ = {
            ...scope,
            ...scope.$buildLib(scope)
        };
        with (scope.values) {
            return eval(script);
        }
    },
    deep(scope, object) {
        if (object instanceof utils.JavaScriptCode) {
            return evaluators.javsScript(scope, object.code);
        }

        if (Array.isArray(object)) {
            return object.map(item => evaluators.deep(scope, item));
        }

        if (typeof object === 'object') {
            const clone = {};
            Object.keys(object)
                .forEach(key => clone[key] = evaluators.deep(scope, object[key]));
            return clone;
        }
        return object;
    },
    javsScript(scope, javascript) {
        return evaluators.eval(scope, javascript);
    },
    coffeeScript(scope, coffeescript) {
        const javascript = coffeeScript.compile(coffeescript, { bare: true });
        return evaluators.javsScript(scope, javascript);
    },
    liveScript(scope, livescript) {
        const javascript = liveScript.compile(livescript, { bare: true });
        return evaluators.javsScript(scope, javascript);
    },
    script(scope, script) {
        try {
            if (script instanceof utils.JavaScriptCode)
                return evaluators.javsScript(scope, script.code);
            return evaluators.liveScript(scope, script);
        } catch (e) {
            throw utils.pktError(scope, e, `failed to evalute`);
        }
    },
    template(scope, text) {
        try {
            const tpl = _.template(text);
            const yaml = tpl({
                ...scope.values,
                $: scope
            });
            const objects = yamls.loadAll(yaml);
            return objects;
        } catch (e) {
            throw utils.pktError(scope, e, 'failed to parse template');
        }
    },
}


module.exports = evaluators;
