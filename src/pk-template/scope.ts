import jslib from './jslib';
import { IScope, IValues, IStyleSheet, ITrace, IPkt } from './types';
import { IObject } from '../common';
import { StyleSheet } from './styles/styleSheet';
import { PathResolver } from './pathResolver';
import { PkProjectConf } from '../pk-conf/projectConf';
import { pktError } from './utils';
import { Trace } from './trace';
import { isHttp } from '../pk-path/isHttp';
import { getSyncRequest, getUnderscore } from '../lazy';
import { readFileSync, readdirSync } from 'fs';
import { parseYamlAll, parseYaml, parseYamlAsPkt } from '../pk-yaml';

const clone = (obj: any): any => JSON.parse(JSON.stringify(obj));

export class Scope extends PathResolver implements IScope {
    objects: IObject[];
    values: IValues;
    pvalues: IValues;
    object: IObject | null = null;
    value: any;
    parent: IScope;
    $buildLib: any;
    trace: ITrace;
    conf?: PkProjectConf;
    styleSheet: IStyleSheet;

    constructor({ objects, values, uri, parent, styleSheet }: any) {
        super(uri);

        this.objects = objects;
        this.values = values;
        this.pvalues = {};
        this.uri = uri;
        this.parent = parent;
        this.styleSheet = styleSheet;
        this.$buildLib = jslib;
        this.trace = parent && parent.trace || new Trace('');
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
            objects: objects ? [...objects] : [],
            values: values || this.values,
            uri: uri || this.uri,
            parent: this,
            styleSheet: this.styleSheet,
            $buildLib: jslib,
        });

        const rst = handler(scope);

        for (const key of Object.keys(scope.values)) {
            if (key in this.values) {
                this.values[key] = key in scope.pvalues
                    ? scope.pvalues[key]
                    : scope.values[key];
            }
        }

        return rst;
    }

    defineValues(values: IValues) {
        for (const key of Object.keys(values)) {
            if (!(key in this.pvalues)) {
                this.pvalues[key] = this.values[key];
            }
        }
        this.values = {
            ...this.values,
            ...values,
        };

    }

    assignValues(values: IValues) {
        for (const key of Object.keys(values)) {
            if (key in this.values) {
                this.values[key] = values[key];
            } else {
                throw this.error(`value ${key} is not defined`);
            }
        }
    }

    // loader
    loadText(uri: string): { uri: string, data: string } {
        uri = this.resolve(uri);
        try {
            return {
                uri,
                data: isHttp(uri)
                    ? getSyncRequest()('GET', uri).getBody('utf8')
                    : readFileSync(uri, 'utf8')
            };
        } catch (e) {
            throw this.error(`failed to load ${uri}`, e);
        }
    }

    loadYaml(uri: string): { uri: string, data: any } {
        const rst = this.loadText(uri);
        try {
            return {
                uri: rst.uri,
                data: parseYaml(rst.data),
            };
        } catch (e) {
            throw this.error(`failed to parse yaml ${uri}`, e);
        }
    }

    loadYamlAll(uri: string): { uri: string, data: any[] } {
        const rst = this.loadText(uri);
        try {
            return {
                uri: rst.uri,
                data: parseYamlAll(rst.data),
            };
        } catch (e) {
            throw this.error(`failed to parse yaml ${uri}`, e);
        }
    }

    loadPkt(uri: string): { uri: string, data: IPkt } {
        const rst = this.loadText(uri);
        try {
            const yamls = parseYamlAsPkt(rst.data, rst.uri);
            if (yamls.length == 0) {
                return { uri: rst.uri, data: { header: {}, statements: [] } }
            }
            if (yamls[0]['/properties'] || yamls[0]['/schema']) {
                const header = yamls[0];
                return { uri: rst.uri, data: { header, statements: yamls.slice(1) } }
            }
            return {
                uri: rst.uri,
                data: { header: {}, statements: yamls },
            };
        } catch (e) {
            throw this.error(`failed to parse yaml ${uri}`, e);
        }
    }

    loadTemplate(uri: string): { uri: string, data: string } {
        const rst = this.loadText(uri);
        try {
            return {
                uri: rst.uri,
                data: getUnderscore().template(rst.data),
            };
        } catch (e) {
            throw this.error(`failed to parse template ${uri}`, e);
        }
    }

    listFiles(uri: string): { uri: string, data: string[] } {
        uri = this.resolve(uri);
        if (isHttp(uri)) {
            throw new Error(`cannot get directory listing from ${uri}`);
        }

        return {
            uri,
            data: readdirSync(uri),
        };
    }

    log = (...args: any) => this.trace.log(...args);

    error(msg: string, error?: Error): Error {
        const err = pktError(this, error || new Error(msg), msg);
        return err;
    }

    static Create(values: IValues, uri: string, parent: IScope | null, objects: IObject[], styleSheet: IStyleSheet): IScope {
        const scope = new Scope({
            objects: objects ? [...objects] : [],
            values: values ? clone(values) : {},
            uri: uri || '.',
            styleSheet: styleSheet || (parent ? parent.styleSheet : null),
            parent: parent || null,
            trace: new Trace('$'),
        });
        return scope;
    }

    static CreateRoot(objects: IObject[], values: IValues) {
        return Scope.Create(
            values,
            process.cwd() + '/',
            null,
            objects,
            new StyleSheet(null),
        );
    }
}
