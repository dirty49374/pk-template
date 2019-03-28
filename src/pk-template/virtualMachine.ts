
import { IScope, IStatement, IStatementSpec, IPkStatementResult, ILanguageRuntime, ILanguageSpec, ILanguageVm, IValues } from './types';
import { CustomYamlTag } from '../pk-yaml/customTags';

export type NextStatement = (scope: IScope) => IPkStatementResult;

export class LanguageVm<T extends ILanguageRuntime> implements ILanguageVm<T> {
    private state: string = '';
    private languageSpec: ILanguageSpec<T>;
    constructor(public runtime: T) {
        this.languageSpec = runtime.createLanguageSpec();
    }

    findStatementSpec(state: string, stmt: IStatement): IStatementSpec<T>[] {
        const stmtSpecs = this.languageSpec.states[state];
        if (!stmt) {
            if (stmtSpecs['$default']) {
                return [stmtSpecs['$default']];
            }
            return [];
        }

        let specs = Object.keys(stmt)
            .filter(k => k[0] === '/')
            .map(k => stmtSpecs[k])
            .filter(s => s)
            .sort((a, b) => a.order - b.order);

        if (stmtSpecs['$default']) {
            specs.push(stmtSpecs['$default']);
        }

        return specs;
    }

    sandbox(scope: IScope, values?: IValues) {
        return this.languageSpec.sandbox(scope, values || {});
    }

    evalAllCustomTags(scope: IScope, node: any): any {
        if (node instanceof CustomYamlTag) {
            node = node.evaluate(scope, this.sandbox(scope), this.evalAllCustomTags);
        }
        if (Array.isArray(node)) {
            return node.map(item => this.evalAllCustomTags(scope, item));
        } else if (typeof node === 'object') {
            if (node === null) return node;

            const clone: any = {};
            Object.keys(node)
                .forEach((key: string) => clone[key] = this.evalAllCustomTags(scope, node[key]));
            return clone;
        }
        return node;
    }

    eval(tag: CustomYamlTag, scope: IScope, values?: IValues): any {
        return tag.evaluate(scope, this.sandbox(scope, values), this.eval);
    }

    execute(scope: IScope, stmt: any, state: string) {
        let key = null;
        const idx = state.indexOf(':');
        if (idx != -1) {
            key = state.substr(idx + 1);
            state = state.substr(0, idx);
        }

        if (key) {
            const lastState = this.state;
            this.state = state;

            const spec = this.languageSpec.states[state][key] as IStatementSpec<T>;
            const rst = spec.handler(this, scope, stmt, () => { });

            this.state = lastState;
            return rst;
        } else {
            const lastState = this.state;
            this.state = state;

            const specs = this.findStatementSpec(state, stmt);
            if (specs.length != 0) {
                const run = (scope: IScope, left: IStatementSpec<T>[]): IPkStatementResult => {
                    const spec = left.shift();
                    if (!spec) {
                        return {};
                    }
                    return spec.handler(this, scope, stmt, (scope: IScope) => run(scope, left));
                }
                const rst = run(scope, specs);
                if (rst.exit) {
                    this.state = lastState;
                    return rst;
                }
                this.state = lastState;
                return rst;
            }
            this.state = lastState;
            return {};
        }
    }

    run(scope: IScope, path: string) {
        const { uri, data } = scope.loadText(path);
        scope.child2({ uri }, cscope => {
            const code = this.languageSpec.compile(scope, data, uri); 2
            this.execute(cscope, code, this.languageSpec.initialState);
        });
    }

    static Run<T extends ILanguageRuntime>(runtime: T, scope: IScope, uri: string): void {
        const vm = new LanguageVm<T>(runtime);
        vm.run(scope, uri);
    }
}
