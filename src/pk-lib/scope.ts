import * as vm from 'vm';
import url from 'url';
import jslib from './jslib';
import { IScope, IValues, IConfig, IStyleSheet, IPkt, CustomYamlTag, IStyle, IOptions, ITrace } from './types';
import { IObject } from '../common';
import { Evaluator } from './evaluator';
import { Loader } from './loader';
import { getChalk } from './lazy';
import { StyleSheet } from './styles/styleSheet';

const clone = (obj: any): any => JSON.parse(JSON.stringify(obj));

export class Scope implements IScope {
    objects: IObject[];
    object: IObject | null = null;
    values: IValues;
    uri: string;
    parent: IScope;
    config: IConfig;
    userdata: any;
    $buildLib: any;
    trace?: ITrace;

    styleSheet: IStyleSheet;
    private evaluator: Evaluator;
    private loader: Loader;

    constructor({ objects, values, uri, parent, styleSheet, config, userdata }: any) {
        this.objects = objects;
        this.values = values;
        this.uri = uri;
        this.parent = parent;
        this.styleSheet = styleSheet;
        this.config = config;
        this.userdata = userdata;
        this.$buildLib = jslib;
        this.evaluator = new Evaluator(this);
        this.loader = new Loader(this);
    }

    resolve(path: string): string {
        const p1 = this.config.resolve ? this.config.resolve(path) : path; // resolve @
        const resolved = url.resolve(this.uri, p1);
        return resolved || '.';
    }

    add(object: any): void {
        let scope: IScope = this;
        while (scope) {
            scope.objects.push(object);
            scope = scope.parent;
        }
    }

    child<T>({ uri, objects, values }: any, handler: (scope: IScope) => T): T {
        const scope = new Scope({
            objects: objects || [],
            values: values || clone(this.values),
            uri: uri || this.uri,
            config: this.config,
            parent: this,
            styleSheet: this.styleSheet,
            userdata: this.userdata,
            $buildLib: jslib,
        });

        return handler(scope);
    }

    private showErrorLocation(e: Error, src: string) {
        //@ts-ignore
        const match = e.stack.match(/<anonymous>:(\d+):(\d+)/);
        if (match) {
            const [_, sline, scol] = match;
            const line = Number(sline)
            const col = Number(scol)

            const lines = src.split('\n');
            const from = Math.max(0, line - 4);
            const to = Math.min(line + 5, lines.length);

            const grey = getChalk().grey;
            const red = getChalk().red;

            for (let i = from; i < to; ++i) {
                const ln = `${i + 1} |`.padStart(6, ' ');
                console.log(grey(ln) + lines[i]);
                if (i + 1 == line) {
                    console.log(grey('     |') + "".padStart(col - 1, ' ') + '^------------ ' + red(e.message));
                }
            }
        } else {
            console.log(e.stack);
        }
    }

    eval(src: string, uri?: string, additionalValues?: any) {
        try {
            const $ = additionalValues
                ? { ...this, ...this.$buildLib(this), ...additionalValues }
                : { ...this, ...this.$buildLib(this) };
            const sandbox = { $, console, ...this.values };
            const context = vm.createContext(sandbox);
            const script = new vm.Script(src);

            // run the script
            return script.runInContext(context, {
                lineOffset: 0,
                displayErrors: true,
            });
        } catch (e) {
            console.log('SCRIPT ERROR:', getChalk().red(e.message));
            console.log('  scope  : ', this.uri)
            if (uri) {
                console.log('  code   : ', uri)
            }
            if (this.trace) {
                console.log('  pos    : ', this.trace.pos());
            }

            this.showErrorLocation(e, src);
            process.exit(1);
        }
    }

    loadText = (uri: string): { uri: string, data: string } => this.loader.loadText(uri);
    loadYaml = (uri: string): { uri: string, data: any } => this.loader.loadYaml(uri);
    loadYamlAll = (uri: string): { uri: string, data: any[] } => this.loader.loadYamlAll(uri);

    loadPkt = (uri: string): { uri: string, data: IPkt } => this.loader.loadPkt(uri);
    loadTemplate = (uri: string): { uri: string, data: string } => this.loader.loadTemplate(uri);
    listFiles = (uri: string): { uri: string, data: string[] } => this.loader.listFiles(uri);

    // evaluater
    evalTemplate = (tpl: string): string => this.evaluator.evalTemplate(tpl);
    evalTemplateAll = (text: string): any[] => this.evaluator.evalTemplateAll(text);

    evalCustomYamlTag = (code: CustomYamlTag): any => this.evaluator.evalCustomYamlTag(code);
    evalScript = (script: CustomYamlTag | string): any => this.evaluator.evalScript(script);

    evalAllCustomTags = (node: any): any => this.evaluator.evalAllCustomTags(node);
    expandCaretPath = (object: any): void => this.evaluator.expandCaretPath(object);
    evalObject = (object: any): any => this.evaluator.evalObject(object);

    // style
    expandStyle = (object: any): void => this.styleSheet.apply(this, object);

    static Create(values: IValues, uri: string, parent: IScope | null, config: IConfig, objects: IObject[], styleSheet: IStyleSheet, userdata: any): IScope {
        const scope = new Scope({
            objects: objects ? [...objects] : [],
            values: values ? clone(values) : {},
            uri: uri || '.',
            styleSheet: styleSheet || (parent ? parent.styleSheet : null),
            parent: parent || null,
            config: config || {},
            userdata: userdata || {},
        });
        return scope;
    }

    static CreateRoot(objects: IObject[], values: IValues, config: IConfig, options: IOptions, userdata: any) {
        return Scope.Create(
            values,
            '.',
            null,
            config,
            objects,
            new StyleSheet(null),
            userdata || {}
        );
    }
}
