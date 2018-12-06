const path = require("path")
const url = require('url');
const fs = require("fs")
const Handlebars = require('handlebars');
const jsyaml = require('js-yaml');
const syncRequest = require('sync-request');

const urlPrefixes = [ 'http://', 'https://' ];
const isAbsoluteUrl = p => urlPrefixes.some(prefix => p.startsWith(prefix));

class Context {
    constructor(objects, values, workingdir, preset) {
        this.objects = objects;
        this.values = values;
        this.workingdir = workingdir;
        this.preset = preset;
        this.isurl = isAbsoluteUrl(workingdir);
    }

    convertPath(relpath) {
        if (isAbsoluteUrl(relpath)) {
            return relpath;
        }

        if (isAbsoluteUrl(this.workingdir)) {
            return url.resolve(this.workingdir, relpath);
        }

        return path.join(this.workingdir, relpath);
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
        return Handlebars.compile(raw);
    }

    useSpec(spec) {
        const objects = this.objects;
        const values = {
            ...(spec.values || {}),
            ...(this.preset && spec.presets && spec.presets[this.preset] || {}),
            ...this.values
        };

        return [ new Context(objects, values, this.workingdir, null), spec ];
    }

    setWorkingDir(workingdir) {
        return new Context(this.objects, this.values, workingdir, this.preset);
    }

    loadSpec(relpath) {
        const cpath = this.convertPath(relpath);
        
        const workingdir = path.dirname(cpath);
        const spec = this.loadYaml(cpath);

        return this.setWorkingDir(workingdir).useSpec(spec);
    }

    useStep(step) {
        const values = {
            ...this.values,
            ...(step.values || {})
        };
        const preset = step.preset || this.preset;

        return new Context(this.objects, values, this.workingdir, preset);
    }

    applyTemplate(relpath) {
        const cpath = this.convertPath(relpath);
        const tpl = this.loadTemplate(cpath);
        const raw = tpl(this.values);
        const objects = jsyaml.loadAll(raw);
        
        this.objects.push(...objects);
    }

    applyValues(values) {
        values = {
            ...this.values,
            ...(values || {})
        };
        return new Context(this.objects, values, this.workingdir, this.preset);
    }

    dumpObjects() {
        return this.objects.map(o => jsyaml.dump(o)).join('---\n');
    }
}

module.exports = { Context };
