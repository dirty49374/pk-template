
import { IScope, IStatement, IStatementSpec, IPkStatementResult, ILanguageRuntime, ILanguageSpec, ILanguageVm, IValues } from './types';
import { CustomYamlTag } from '../pk-yaml/customTags';

export class LanguageVm<T extends ILanguageRuntime> implements ILanguageVm<T> {
    private state: string = '';
    constructor(private languageSpec: ILanguageSpec<T>, public runtime: T) {
    }

    findStatementSpec(stmt: IStatement): IStatementSpec<T>[] {
        const stmtSpecs = this.languageSpec.states[this.state];
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
    }

    sandbox(scope: IScope, values?: IValues) {
        return this.languageSpec.sandbox(scope, values || {});
    }

    eval(tag: CustomYamlTag, scope: IScope, values?: IValues): any {
        return tag.evaluate(scope, this.sandbox(scope, values));
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

            const specs = this.findStatementSpec(stmt);
            if (specs.length != 0) {
                const run = (scope: IScope, left: IStatementSpec<T>[]): IPkStatementResult => {
                    const spec = left.splice(0, 1)[0];
                    return spec.handler(this, scope, stmt, (scope: IScope) => left.length != 0 ? run(scope, left) : {});
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
        scope.child({ uri }, cscope => {
            const code = this.languageSpec.compile(scope, data, uri); 2
            this.execute(cscope, code, this.languageSpec.initialState);
        });
    }

    static Run<T extends ILanguageRuntime>(langSpec: ILanguageSpec<T>, scope: IScope, uri: string): void {
        const runtime = langSpec.createRuntime();
        const vm = new LanguageVm(langSpec, runtime);
        vm.run(scope, uri);
    }
}
