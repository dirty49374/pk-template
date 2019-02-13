import _ from 'underscore';
import liveScript from 'livescript';
import coffeeScript from 'coffeescript';
import * as utils from './utils';
import * as yamls from './yamls';
import loaders from './loaders';
import { IScope } from './scope';
const evalWithValues = require('./eval');

const evaluators = {
    eval(scope: IScope, script: string) {
        const $ = {
            ...scope,
            ...scope.$buildLib(scope)
        };
        return evalWithValues($, script, scope.values);
    },
    deep(scope: IScope, object: any): any {
        if (object instanceof utils.JavaScriptCode) {
            return evaluators.javaScriptCode(scope, object);
        }

        if (Array.isArray(object)) {
            return object.map(item => evaluators.deep(scope, item));
        }

        if (typeof object === 'object') {
            if (object === null) return object;

            const clone: any = {};
            Object.keys(object)
                .forEach(key => clone[key] = evaluators.deep(scope, object[key]));
            return clone;
        }
        return object;
    },
    javaScript(scope: IScope, javascript: string): any {
        return evaluators.eval(scope, javascript);
    },
    javaScriptCode(scope: IScope, code: utils.JavaScriptCode) {
        switch (code.type) {
            case 'js':
                return evaluators.javaScript(scope, code.code);
            case 'file':
                return loaders.text(scope, code.code);
        }
    },
    coffeeScript(scope: IScope, coffeescript: string): any {
        const javascript = coffeeScript.compile(coffeescript, { bare: true });
        return evaluators.javaScript(scope, javascript);
    },
    liveScript(scope: IScope, livescript: string): any {
        const javascript = liveScript.compile(livescript + '\n', { bare: true });
        return evaluators.javaScript(scope, javascript);
    },
    script(scope: IScope, script: utils.JavaScriptCode | string): any {
        try {
            if (script instanceof utils.JavaScriptCode)
                return evaluators.javaScriptCode(scope, script);
            return evaluators.liveScript(scope, script);
        } catch (e) {
            throw utils.pktError(scope, e, `failed to evalute`);
        }
    },
    template(scope: IScope, text: string): any[] {
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


export default evaluators;
