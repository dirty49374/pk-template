
import { IScope, IValues, IStatement, IRuntime, IStatementSpec, IStatementSpecs, PkStatementResult } from './types';
import { Trace } from './trace';
import { languageSpec } from './languageSpec';

export function buildProperties(properties: any, parentValues: IValues): any {
    const values = {
        cluster: null,
        env: null,
        namespace: null,
        ...(properties || {}),
    };
    for (const k in parentValues) {
        if (k in values)
            values[k] = parentValues[k];
    }
    return values;
}

export class Runtime implements IRuntime {
    mode: string;
    trace: Trace;
    constructor(uri: string) {
        this.mode = '';
        this.trace = new Trace(uri);
    }

    findStatementSpec(stmt: IStatement): IStatementSpec[] {
        const stmtSpecs = (languageSpec as any)[this.mode] as IStatementSpecs;
        if (!stmt) {
            if (stmtSpecs['default']) {
                return [stmtSpecs['default']];
            }
            return [];
        }

        let specs = Object.keys(stmt)
            .map(k => stmtSpecs[k])
            .filter(s => s)
            .sort((a, b) => a.order - b.order);

        if (stmtSpecs['default']) {
            specs.push(stmtSpecs['default']);
        }

        return specs;

        // for (const key of Object.keys(specs)) {
        //     if (!(key in stmt)) {
        //         continue;
        //     }
        //     const def = specs[key];
        //     for (const k of Object.keys(stmt)) {
        //         if (k === key) {
        //             continue;
        //         }
        //         throw new Error(`cannot use '${k}' in ${key}`);
        //     }
        //     if (def.mandotories) {
        //         for (const k of def.mandotories) {
        //             if (!(k in stmt)) {
        //                 throw new Error(`${key} statement requires ${k} field`);
        //             }
        //         }
        //     }

        //     return def;
        // }
        // const slashKey = Object.keys(stmt).find(k => k.length > 0 && k[0] == '/');
        // if (slashKey) {
        //     throw new Error(`unknown statement ${slashKey}`)
        // }
        // return null;
    }

    execute(scope: IScope, stmt: any, mode: string) {
        let key = null;
        const idx = mode.indexOf(':');
        if (idx != -1) {
            key = mode.substr(idx + 1);
            mode = mode.substr(0, idx);
        }
        if (key) {
            const lastMode = this.mode;
            this.mode = mode;

            const spec = (languageSpec as any)[mode][key] as IStatementSpec;
            const rst = spec.handler(this, scope, stmt, () => { });

            this.mode = lastMode;
            return rst;
        } else {
            const lastMode = this.mode;
            this.mode = mode;

            const specs = this.findStatementSpec(stmt);
            if (specs.length != 0) {
                const run = (scope: IScope, left: IStatementSpec[]): PkStatementResult => {
                    const spec = left.splice(0, 1)[0];
                    return spec.handler(this, scope, stmt, (scope: IScope) => left.length != 0 ? run(scope, left) : {});
                }
                const rst = run(scope, specs);
                if (rst.exit) {
                    this.mode = lastMode;
                    return rst;
                }
                this.mode = lastMode;
                return rst;
            }
            this.mode = lastMode;
            return {};
        }
    }

    static Run(scope: IScope, rpath: string) {
        if (rpath.toLowerCase().endsWith('.pkt')) {
            const { uri, data } = scope.loadPkt(rpath);
            new Runtime(uri).execute(scope, {
                uri,
                file: data,
                withObject: true,
            }, 'pkt:/pkt');
        } else {
            const { data } = scope.loadText(rpath);
            const objects = scope.evalTemplateAll(data);
            scope.objects.push(...objects);
        }
        return true;
    }
}
