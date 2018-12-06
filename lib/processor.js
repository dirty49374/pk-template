const evalScript = ({ objects, values }, script, { expand }) => eval(script);
const isSpec = p => p.toLowerCase().endsWith(".pks");

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
        context.applyTemplate(path);
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

    applyScript(context, script) {
        if (!script) return;

        const funcs = {
            expand: (files, values) => {
                const subContext = context.applyValues(values);
                this.applyFiles(subContext, files);
            }
        };

        evalScript(context, script, funcs);
    }

    expandStep(context, spec, stepNo, stepName) {
        this.log('  - expanding step:', stepNo, '-', stepName);
        this.log('    - values:', JSON.stringify(context.values));

        if (spec.files)
            this.log('    - files:', JSON.stringify(spec.files));

        this.applyFiles(context, spec.files);

        if (spec.script)
            this.log('    - script:');
        this.applyScript(context, spec.script);
    }

    expandSpec(context, spec) {
        if (!spec.steps) return;
    
        spec.steps.forEach((step, no) => {
            const stepContext = context.useStep(step);
            this.expandStep(stepContext, step, no, step.name || 'unnamed');
        });
    }

    expandFile(context, relpath) {
        this.log('- expanding: ', relpath);
        
        const [ newContext, spec ] = isSpec(relpath)
            ? context.loadSpec(relpath)
            : context.useSpec({
                values: {},
                steps: [{
                    files: relpath
                }]
            });
        this.log('  - context:');
        this.log('      objects    =', newContext.objects.length);
        this.log('      values     =', JSON.stringify(newContext.values));
        this.log('      workingdir =', newContext.workingdir);

        this.expandSpec(newContext, spec);
    }

    expandFiles(context, pathes) {
        pathes.forEach(path => this.expandFile(context, path));
    }
}

module.exports = { Processor };
