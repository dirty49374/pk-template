import * as vm from 'vm';
import jslib from './jslib';
import { IScope, IValues, IStyleSheet, IPkt, CustomYamlTag, ITrace, IPktEnv } from './types';
import { IObject } from '../common';
import { Evaluator } from './evaluator';
import { Loader } from './loader';
import { StyleSheet } from './styles/styleSheet';
import { PathResolver } from './pathResolver';
import { PkProjectFile } from '../pk-conf/conf';

const clone = (obj: any): any => JSON.parse(JSON.stringify(obj));

export class Scope extends PathResolver implements IScope {
    objects: IObject[];
    object: IObject | null = null;
    values: IValues;
    parent: IScope;
    $buildLib: any;
    trace?: ITrace;
    conf?: PkProjectFile;
    styleSheet: IStyleSheet;
    env: IPktEnv;
    private evaluator: Evaluator;
    private loader: Loader;

    constructor({ objects, values, uri, parent, styleSheet, env }: any) {
        super(uri);

        this.objects = objects;
        this.values = values;
        this.uri = uri;
        this.parent = parent;
        this.styleSheet = styleSheet;
        this.$buildLib = jslib;
        this.evaluator = new Evaluator(this);
        this.loader = new Loader(this);
        this.env = env;
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
            parent: this,
            styleSheet: this.styleSheet,
            $buildLib: jslib,
            env: this.env,
        });

        return handler(scope);
    }


    eval(src: string, uri?: string, additionalValues?: any) {
        const $ = additionalValues
            ? { ...this, ...this.$buildLib(this), ...additionalValues }
            : { ...this, ...this.$buildLib(this) };
        const sandbox = { $, console, ...this.values };
        try {
            const context = vm.createContext(sandbox);
            const script = new vm.Script(src);

            // run the script
            return script.runInContext(context, {
                lineOffset: 0,
                displayErrors: true,
            });
        } catch (e) {
            e.source = src;
            e.sandbox = sandbox;
            throw e;
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

    static Create(values: IValues, uri: string, parent: IScope | null, objects: IObject[], styleSheet: IStyleSheet, env: IPktEnv | null): IScope {
        const scope = new Scope({
            objects: objects ? [...objects] : [],
            values: values ? clone(values) : {},
            uri: uri || '.',
            styleSheet: styleSheet || (parent ? parent.styleSheet : null),
            parent: parent || null,
            env: env || {},
        });
        return scope;
    }

    static CreateRoot(objects: IObject[], values: IValues, env: IPktEnv | null) {
        return Scope.Create(
            values,
            process.cwd() + '/',
            null,
            objects,
            new StyleSheet(null),
            env
        );
    }
}
