const isSpec = p => p.toLowerCase().endsWith(".pkt");

class Processor {
    constructor() {
        this.logging = false;
    }

    log(...params) {
        this.logging && console.error('# ', ...params);
    }

    setLogging(logging) {
        this.logging = logging;
    }

    expandTemplate(context, path) {
        context.evalTemplate(path);
    }

    applyFiles(context, files) {
        if (!files) return;
    
        const expandedPathes = typeof files == 'string'
            ? files.split(',')
            : files;

        expandedPathes
            .forEach(p => {
                if (isSpec(p)) {
                    this.expandFile(context, p);
                } else {
                    this.expandTemplate(context, p);
                }
            });
    }

    funcs(context) {
        return {
            expand: (files, values) => {
                const subContext = context.applyValues(values);
                this.applyFiles(subContext, files);
            }
        };
    }

    expandValues(context, step) {
        if (!step.values) {
            return;
        }
        const values = {}
        Object.keys(step.values)
            .forEach(key => {
                if (key.endsWith('.js')) {
                    const rkey = key.substring(0, key.length - 3);
                    values[rkey] = context.evalJavaScript(step.values[key], this.funcs(context));
                } else if (key.endsWith('.coffee')) {
                    const rkey = key.substring(0, key.length - 7);
                    values[rkey] = context.evalCoffeeScript(step.values[key], this.funcs(context));
                } else {
                    values[key] = step.values[key];
                }
            });
        return values;
    }



    expandStep(context, step, stepName) {
        this.log('  - expanding step:', stepName);

        // 1. update context.values
        const values = this.expandValues(context, step);

        context = context.applyValues(values);

        // 2. check if
        if (step['if.js']) {
            if (!context.evalJavaScript(step['if.js'], this.funcs(context))) {
                return;
            }
        }

        if (step['if.coffee']) {
            if (!this.evalCoffeeScript(context, step['if.coffee'], this.funcs(context))) {
                return;
            }
        }

        // 3. expand files
        if (step.files) {
            this.applyFiles(context, step.files);
        }

        // 4. execute scripts
        if (step['script.js']) {
            context.evalJavaScript(step['script.js'], this.funcs(context));
        }
        if (step['script.coffee']) {
            context.evalCoffeeScript(step['script.coffee'], this.funcs(context));
        }
    }

    expandSpec(context, spec) {
        if (!spec.steps) return;
    
        spec.steps.forEach((step, no) => {
            this.expandStep(context, step, `[${no}] - ${step.name || 'unnamed'}`);
        });
    }

    expandFile(context, relpath) {
        this.log('- expanding: ', relpath);
        
        let spec;

        if (isSpec(relpath)) {
            [ context, spec ] = context.loadSpec(relpath)
        } else {
            spec = { steps: [{ files: relpath }] };
            context = context.applySpec(spec);
        }

        this.log('  - context:', context);
        this.log('      objects =', context.objects.length);
        this.log('      values  =', JSON.stringify(context.values));
        this.log('      cwd     =', context.cwd);

        this.expandSpec(context, spec);
    }

    expandFiles(context, pathes) {
        pathes.forEach(path => this.expandFile(context, path));
    }
}

module.exports = { Processor };
