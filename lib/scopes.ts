import url from 'url';
import jslib from './jslib';
import { IScope, IObject, IValues, IConfig } from './types';

const clone = (obj: any): any => JSON.parse(JSON.stringify(obj));
class Scope implements IScope {
    objects: IObject[];
    object: IObject | null = null;
    values: IValues;
    uri: string;
    parent: IScope;
    config: IConfig;
    userdata: any;
    $buildLib: any;
    constructor({ objects, values, uri, parent, config, userdata }: any) {
        this.objects = objects;
        this.values = values;
        this.uri = uri;
        this.parent = parent;
        this.config = config;
        this.userdata = userdata;
        this.$buildLib = jslib;
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

    child<T>({ uri, objects, values }: any, handler: (scope: IScope)=>T): T {
        const scope = new Scope({
            objects: objects || [],
            values: values || clone(this.values),
            uri: uri || this.uri,
            config: this.config,
            parent: this,
            userdata: this.userdata,
            $buildLib: jslib,
        });

        return handler(scope);
    }
}

const scopes = {
    create(values: IValues, uri: string, parent: IScope | null, config: IConfig, objects: IObject[], userdata: any): IScope {
        const scope = new Scope({
            objects: objects ? [ ...objects ] : [],
            values: values ? clone(values) : {},
            uri: uri || '.',
            parent: parent || null,
            config: config || {},
            userdata: userdata || {},
        });
        return scope;
    },
};

export default scopes;
