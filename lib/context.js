const path = require("path")
const url = require('url');
const fs = require("fs")
const jsyaml = require('js-yaml');
const syncRequest = require('sync-request');
const _ = require('underscore');
const coffeeScript = require('coffee-script');

_.templateSettings = {
    interpolate: /\<\<\<\=(.+?)\>\>\>/g
};
  
const urlPrefixes = [ 'http://', 'https://' ];
const isAbsoluteUrl = p => urlPrefixes.some(prefix => p.startsWith(prefix));
const evalScript = ({ objects, values }, script, { expand }) => eval(script);

class Context {
    constructor(objects, values, cwd) {
        this.objects = objects;
        this.values = values;
        this.cwd = cwd;
        this.isurl = isAbsoluteUrl(cwd);
    }

    convertPath(relpath) {
        if (isAbsoluteUrl(relpath)) {
            return relpath;
        }

        if (isAbsoluteUrl(this.cwd)) {
            return url.resolve(this.cwd, relpath);
        }

        return path.join(this.cwd, relpath);
    }

    loadRaw(cpath) {
        return isAbsoluteUrl(cpath)
            ? syncRequest('GET', cpath).getBody('utf8')
            : fs.readFileSync(cpath, 'utf8');
    }

    loadYaml(cpath) {
        const raw = this.loadRaw(cpath);
        return jsyaml.load(raw);
    }

    loadTemplate(cpath) {
        const raw = this.loadRaw(cpath);
        return _.template(raw);
    }

    loadSpec(relpath) {
        const cpath = this.convertPath(relpath);
        
        const cwd = path.dirname(cpath);
        const spec = this.loadYaml(cpath);

        const context = this.applyCwd(cwd).applySpec(spec);
        return [ context, spec ];
    }

    applySpec(spec) {
        const objects = this.objects;
        const values = {
            ...(spec.values || {}),
            ...this.values
        };

        return new Context(objects, values, this.cwd, null);
    }

    applyCwd(cwd) {
        return new Context(this.objects, this.values, cwd);
    }
    
    applyValues(values) {
        const values = {
            ...this.values,
            ...(values || {})
        };

        return new Context(this.objects, values, this.cwd);
    }

    applyValues(values) {
        values = {
            ...this.values,
            ...(values || {})
        };
        return new Context(this.objects, values, this.cwd);
    }

    dumpObjects() {
        return this.objects.map(o => jsyaml.dump(o)).join('---\n');
    }

    evalJavaScript(javascript, funcs) {
        return evalScript(this, javascript, funcs);
    }

    evalCoffeeScript(coffeescript, funcs) {
        const javascript = coffeeScript.compile(coffeescript);
        return this.evalJavaScript(javascript, funcs);
    }

    evalTemplate(relpath) {
        const cpath = this.convertPath(relpath);
        const tpl = this.loadTemplate(cpath);
        const raw = tpl(this);
        const objects = jsyaml.loadAll(raw);
        
        this.objects.push(...objects);
    }
}

module.exports = { Context };
