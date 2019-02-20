import url from 'url';
import jslib from './jslib';
import { IScope, IValues, IConfig, IStyleSheet, IPkt, CustomYamlTag, IStyle } from './types';
import { IObject } from '../common';
import { Evaluator } from './evaluator';
import { Loader } from './loader';


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
}
