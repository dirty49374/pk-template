import { IScope, IValues, IPkStatementResult, IPkt, ILanguageSpec, ILanguageVm, IPktHeader } from "./types";
import { getJsonPath, getJsonPatch, getUnderscore } from "../lazy";
import { pktError, setValue, deepCloneWithFunction } from "./utils";
import { StyleSheet } from './styles/styleSheet';
import { JsonSchema } from "./jsonSchema";
import selectors from "./selectors";
import { parseYamlAsPkt, parseYamlAll } from "../pk-yaml";
import jslib from "./jslib";
import { forEachTreeObjectKey } from "../common";
import { CustomYamlTag } from "../pk-yaml/customTags";
import { NextStatement } from "./virtualMachine";
import { resolve as resolvePath, parse as parsePath } from "path";

const PKT_INITIAL_STATE = 'pkt:$initial';
const PKT_IMPORT_INITIAL_STATE = 'import:$initial';

export interface IPktOptions {
}

// TODO: merge loadPkt in scope.ts
export const compilePkt = (src: string, uri: string): IPkt => {
  const yamls = parseYamlAsPkt(src, uri);
  if (yamls.length == 0) {
    return { header: {}, statements: [] };
  }
  if (yamls[0] && (yamls[0]['/properties'] || yamls[0]['/schema'] || yamls[0]['/import'] || yamls[0]['/require'])) {
    const header = yamls[0];
    return { header, statements: yamls.slice(1) };
  }
  return { header: {}, statements: yamls };
}

export class PktRuntime {
  private buildProperties(properties: any, parentValues: IValues): any {
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


  private checkStrictCheckedValues(header: IPktHeader, strictValues: IValues, uri: string) {
    if (header['/properties']) {
      const undefinedValue = Object.keys(strictValues)
        .find(k => !(k in header['/properties']));
      if (undefinedValue) {
        throw new Error(`${undefinedValue} is not defined at ${uri}`);
      }
    }
  }

  private executeFile(vm: ILanguageVm<PktRuntime>, scope: IScope, rpath: string, strictValues: IValues) {
    if (rpath.toLowerCase().endsWith('.pkt')) {
      const { uri, data } = scope.loadPkt(rpath);
      this.checkStrictCheckedValues(data.header, strictValues, uri);

      const values = strictValues ? this.evalObject(vm, scope, strictValues) : {};
      scope.child2({ uri, values }, (cscope: IScope) => {
        vm.execute(cscope, { uri, pkt: data }, PKT_INITIAL_STATE);
      });
    } else {
      const { uri, data } = scope.loadText(rpath);
      const values = strictValues ? this.evalObject(vm, scope, strictValues) : {};
      scope.child2({ uri, values }, (cscope: IScope) => {
        vm.runtime.evalTemplateAll(vm, cscope, data)
          .filter(o => o)
          .forEach(o => cscope.add(o));
      });
    }
  }

  private importFile(vm: ILanguageVm<PktRuntime>, scope: IScope, rpath: string) {
    if (!rpath.toLowerCase().endsWith('.pkt')) {
      throw scope.error(`can not import non pkt file ${rpath}`);
    }
    const { uri, data } = scope.loadPkt(rpath);
    vm.execute(scope, { uri, pkt: data }, PKT_IMPORT_INITIAL_STATE);
  }

  private expandStyleSheet(vm: ILanguageVm<PktRuntime>, scope: IScope, object: any): void {
    this.expandStyle(vm, scope, object);
  }

  // style
  private expandStyle = (vm: ILanguageVm<PktRuntime>, scope: IScope, object: any): void =>
    scope.styleSheet.apply(vm, scope, object);

  private expandCaretPath(object: any) {
    forEachTreeObjectKey(object, (node: any, key: string, value: any) => {
      if (key.startsWith('^') && key.length > 1) {
        delete node[key];
        setValue(node, key.substr(1), value);
      }
    });
  }


  private deleteUndefined(node: any) {
    if (node === undefined) {
      return;
    }
    if (Array.isArray(node)) {
      for (let i = node.length - 1; i >= 0; --i) {
        const val = node[i];
        if (val === undefined) {
          node.splice(i, 1);
        } else {
          this.deleteUndefined(node[i]);
        }
      }
    } else if (typeof node === 'object') {
      if (node === null) return node;
      Object.keys(node)
        .forEach((key: string) => {
          const val = node[key];
          if (val === undefined) {
            delete node[key];
          } else {
            this.deleteUndefined(node[key]);
          }
        });
    }
  }

  private evalObject(vm: ILanguageVm<PktRuntime>, scope: IScope, object: any): any {
    object = vm.evalAllCustomTags(scope, object);
    this.expandCaretPath(object);
    this.expandStyleSheet(vm, scope, object);
    this.deleteUndefined(object);

    return object;
  }

  // evaluater
  evalTemplate(vm: ILanguageVm<PktRuntime>, scope: IScope, tpl: string): string {
    const _ = getUnderscore();
    return _.template(tpl)(vm.sandbox(scope));
  }
  private evalTemplateAll(vm: ILanguageVm<PktRuntime>, scope: IScope, text: string): any[] {
    try {
      const tpl = getUnderscore().template(text);
      const yaml = tpl(vm.sandbox(scope));
      const objects = parseYamlAll(yaml);
      return objects;
    } catch (e) {
      throw scope.error('failed to parse template', e);
    }
  }
  // }

  // const pktLanguage: ILanguageSpec<PktRuntime> = {
  createLanguageSpec() {
    const spec: ILanguageSpec<PktRuntime> = {
      compile: this.compile,
      initialState: PKT_INITIAL_STATE,
      states: {},
      sandbox: this.sandbox,
    };
    for (const key of Object.getOwnPropertyNames(PktRuntime.prototype)) {
      const item = (this as any)[key];
      if (typeof item == 'function') {
        const m = key.match(/^([^_]+):(\d+):([^_]+)$/);
        if (m) {
          const state = spec.states[m[1]] || (spec.states[m[1]] = {});
          state[m[3]] = {
            name: m[3],
            order: Number(m[2]),
            handler: (this as any)[key],
          };
        }
      }
    }
    return spec;
  }
  compile(scope: IScope, src: string, uri: string): any {
    try {
      return {
        uri,
        pkt: compilePkt(src, uri),
        withObject: true,
      }
    } catch (e) {
      throw scope.error(`failed to parse yaml ${uri}`, e);
    }
  }
  sandbox(scope: IScope, values?: IValues): any {
    const $ = values
      ? { ...scope, ...jslib(scope), ...values }
      : { ...scope, ...jslib(scope) };
    const sandbox = { $, console, Buffer, ...scope.values };
    return sandbox;
  }
  ['pkt:100:$initial'](vm: ILanguageVm<PktRuntime>, scope: IScope, stmt: any, next: NextStatement): IPkStatementResult {
    if (!stmt) return {};
    if (!scope) throw 'no parent scope';

    const uri = stmt.uri;
    const pkt = stmt.pkt as IPkt;
    const options = stmt.options as IPktOptions;

    scope.trace.into(() => {
      const values = deepCloneWithFunction(scope.values);
      scope.child2({ uri, values }, cscope => {
        cscope.trace.step('header');
        const rst = vm.execute(cscope, pkt.header, 'decl');
        if (rst.exit) {
          return {};
        }

        for (let i = 0; i < pkt.statements.length; ++i) {
          cscope.trace.step(i);
          const rst = vm.execute(cscope, pkt.statements[i], 'stmt');
          if (rst.exit) {
            return {};
          }
        }
      });
    });
    return {};
  }
  ['import:100:$initial'](vm: ILanguageVm<PktRuntime>, scope: IScope, stmt: any): IPkStatementResult {
    if (!stmt) return {};
    if (!scope) throw 'no parent scope';

    const uri = stmt.uri;
    const pkt = stmt.pkt as IPkt;
    const withObject = stmt.withObject;

    scope.trace.into(() => {
      scope.trace.step('header');
      const rst = vm.execute(scope, pkt.header, 'decl');
      if (rst.exit) {
        return {};
      }

      for (let i = 0; i < pkt.statements.length; ++i) {
        scope.trace.step(i);
        const rst = vm.execute(scope, pkt.statements[i], 'stmt');
        if (rst.exit) {
          return {};
        }
      }
    });
    return {};
  }
  ['decl:100:/properties'](vm: ILanguageVm<PktRuntime>, scope: IScope, stmt: any, next: NextStatement): IPkStatementResult {
    // 2. build properties
    scope.trace.step('/properties');
    if (stmt['/properties']) {
      scope.values = vm.runtime.buildProperties(stmt['/properties'], scope.values);
    }
    return next(scope);
  }
  ['decl:101:/schema'](vm: ILanguageVm<PktRuntime>, scope: IScope, stmt: any, next: NextStatement): IPkStatementResult {
    scope.trace.step('schema');
    const schema = new JsonSchema(stmt['/schema']);
    const errors = schema.validate(scope.values);
    if (errors) {
      throw scope.error('property validation failed', new Error(errors));
    }
    return next(scope);
  }
  ['decl:102:/import'](vm: ILanguageVm<PktRuntime>, scope: IScope, stmt: any, next: NextStatement): IPkStatementResult {
    scope.trace.step('/import');
    let rpathes = stmt['/import'];
    if (!Array.isArray(rpathes)) {
      rpathes = [rpathes];
    }

    for (const rpath of rpathes) {
      let childValues: IValues = {};

      scope.child2({ objects: [], orphan: true }, (cscope) => {
        vm.runtime.importFile(vm, cscope, rpath);
        childValues = cscope.values;
      });

      scope.values = {
        ...scope.values,
        ...childValues,
      };
    }

    return next(scope);
  }
  ['decl:103:/stylesheet'](vm: ILanguageVm<PktRuntime>, scope: IScope, stmt: any, next: NextStatement): IPkStatementResult {
    scope.trace.step('/stylesheet');
    scope.styleSheet = StyleSheet.Build(scope, stmt);
    return next(scope);
  }
  ['decl:103:/require'](vm: ILanguageVm<PktRuntime>, scope: IScope, stmt: any, next: NextStatement): IPkStatementResult {
    scope.trace.step('/require');
    const uri = scope.resolve(stmt['/require']);
    if (uri) {
      const obj = require(uri);
      const name = parsePath(uri).name;
      scope.values = {
        ...scope.values,
        [name]: obj,
      };
    }
    return next(scope);
  }
  ['decl:104:/values'](vm: ILanguageVm<PktRuntime>, scope: IScope, stmt: any, next: NextStatement): IPkStatementResult {
    if (stmt['/values']) {
      scope.trace.step('/values');
      scope.values = {
        ...scope.values,
        ...vm.runtime.evalObject(vm, scope, stmt['/values'] || {}),
      };
    }
    return next(scope);
  }
  ['decl:105:/assign'](vm: ILanguageVm<PktRuntime>, scope: IScope, stmt: any, next: NextStatement): IPkStatementResult {
    if (stmt['/assign']) {
      throw scope.error('header cannot have /assign statement');
      // scope.trace.step('/assign');
      // scope.values = {
      //     ...scope.values,
      //     ...scope.evalObject(stmt['/assign'] || {}),
      // };
    }
    return next(scope);
  }

  ['stmt:000:/if'](vm: ILanguageVm<PktRuntime>, scope: IScope, stmt: any, next: NextStatement): IPkStatementResult {
    return vm.runtime.evalObject(vm, scope, stmt['/if']) ? next(scope) : {};
  }
  ['stmt:001:/unless'](vm: ILanguageVm<PktRuntime>, scope: IScope, stmt: any, next: NextStatement): IPkStatementResult {
    return vm.runtime.evalObject(vm, scope, stmt['/unless']) ? {} : next(scope);
  }
  ['stmt:003:/endIf'](vm: ILanguageVm<PktRuntime>, scope: IScope, stmt: any, next: NextStatement): IPkStatementResult {
    return vm.runtime.evalObject(vm, scope, stmt['/endIf']) ? { exit: true } : {};
  }
  ['stmt:004:/end'](): IPkStatementResult {
    return { exit: true }
  }
  ['stmt:010:/select'](vm: ILanguageVm<PktRuntime>, scope: IScope, stmt: any, next: NextStatement): IPkStatementResult {
    const predicate = selectors.compile(stmt['/select']);
    const objects = scope.objects.filter(predicate);
    const rst = scope.child2({ objects }, cscope => {
      return next(cscope);
    });
    if (rst.exit) {
      return rst;
    }
    return {};
  }
  ['stmt:100:/foreach'](vm: ILanguageVm<PktRuntime>, scope: IScope, stmt: any, next: NextStatement): IPkStatementResult {
    scope.trace.into(() => {
      scope.objects.forEach((o, i) => {
        scope.trace.step(i);
        scope.object = o;
        vm.eval(stmt['/foreach'], scope);
      });
    });
    delete scope.object;
    return {};
  }
  ['stmt:100:/values'](vm: ILanguageVm<PktRuntime>, scope: IScope, stmt: any, next: NextStatement): IPkStatementResult {
    const evaluatedValues = vm.runtime.evalObject(vm, scope, stmt['/values'] || {});
    scope.defineValues(evaluatedValues);
    return {};
  }
  ['stmt:100:/assign'](vm: ILanguageVm<PktRuntime>, scope: IScope, stmt: any, next: NextStatement): IPkStatementResult {
    const values = vm.runtime.evalObject(vm, scope, stmt['/assign'] || {});
    for (const key of Object.keys(values)) {
      if (key in scope.values) {
        scope.values[key] = values[key];
      } else {
        const msg = `value ${key} is not defined`;
        throw pktError(scope, new Error(msg), msg);
      }
    }
    return {};
  }
  ['stmt:100:/exit'](vm: ILanguageVm<PktRuntime>, scope: IScope, stmt: any, next: NextStatement): IPkStatementResult {
    const value = vm.runtime.evalObject(vm, scope, stmt['/exit']);
    if (value) {
      return { exit: true };
    } else {
      return {};
    }
  }
  ['stmt:100:/add'](vm: ILanguageVm<PktRuntime>, scope: IScope, stmt: any, next: NextStatement): IPkStatementResult {
    const object = vm.runtime.evalObject(vm, scope, stmt['/add']);
    scope.add(object);
    return {};
  }
  ['stmt:100:/script'](vm: ILanguageVm<PktRuntime>, scope: IScope, stmt: any, next: NextStatement): IPkStatementResult {
    vm.eval(stmt['/script'], scope);
    return {};
  }

  ['stmt:100:/template'](vm: ILanguageVm<PktRuntime>, scope: IScope, stmt: any, next: NextStatement): IPkStatementResult {
    const objects = vm.runtime.evalTemplateAll(vm, scope, stmt['/template']);
    objects.forEach(object => scope.add(object));
    return {};
  }
  ['stmt:100:/include'](vm: ILanguageVm<PktRuntime>, scope: IScope, stmt: any, next: NextStatement): IPkStatementResult {
    const rpath = stmt['/include'];
    const _with = stmt['/with'] || {};
    scope.child2({ objects: [] }, (cscope) => {
      vm.runtime.executeFile(vm, cscope, rpath, _with);
    })
    return {};
  }
  ['stmt:100:/apply'](vm: ILanguageVm<PktRuntime>, scope: IScope, stmt: any, next: NextStatement): IPkStatementResult {
    const rpath = stmt['/apply'];
    const _with = stmt['/with'] || {};
    vm.runtime.executeFile(vm, scope, rpath, _with);
    return {};
  }
  ['stmt:100:/jsonpath'](vm: ILanguageVm<PktRuntime>, scope: IScope, stmt: any, next: NextStatement): IPkStatementResult {
    const query = stmt['/jsonpath'];
    const apply = stmt['.apply'];
    const merge = stmt['.merge'];
    const exec = stmt['.exec'];

    const jsonpath = getJsonPath();
    scope.trace.into(() => {
      scope.objects.forEach((o, i) => {
        scope.trace.step(i);
        const nodes = jsonpath.nodes(o, query);
        nodes.forEach((node: any) => {
          scope.child2({}, cscope => {
            cscope.object = o;
            cscope.value = node.value;
            if (apply) {
              const value = vm.runtime.evalObject(vm, scope, apply);
              jsonpath.apply(o, jsonpath.stringify(node.path), () => value);
            }
            if (merge) {
              const value = vm.runtime.evalObject(vm, scope, merge);
              const merged = { ...node.value, ...value };
              jsonpath.apply(o, jsonpath.stringify(node.path), () => merged);
            }
            if (exec) {
              vm.eval(exec, cscope);
            }
          });
        })
      });
    });
    return {};
  }
  ['stmt:100:/jsonpatch'](vm: ILanguageVm<PktRuntime>, scope: IScope, stmt: any, next: NextStatement): IPkStatementResult {

    const jsonpatch = getJsonPatch();
    const patch = Array.isArray(stmt['/jsonpatch']) ? stmt['/jsonpatch'] : [stmt['/jsonpatch']];
    scope.trace.into(() => {
      scope.objects.forEach((o, i) => {
        scope.trace.step(i);
        scope.object = o;
        const p = vm.runtime.evalObject(vm, scope, patch);
        jsonpatch.apply(o, p);
        delete scope.object;
      });
    });
    delete scope.object;
    return {};
  }
  ['stmt:100:/routine'](vm: ILanguageVm<PktRuntime>, scope: IScope, stmt: any, next: NextStatement): IPkStatementResult {
    scope.child2({ objects: [] }, scope => {
      for (const cstmt of stmt['/routine']) {
        const rst = vm.execute(scope, cstmt, 'stmt');
        if (rst.exit) {
          return rst;
        }
      }
    });

    return {};
  }
  ['stmt:200:/comment'](vm: ILanguageVm<PktRuntime>, scope: IScope, stmt: any, next: NextStatement): IPkStatementResult {
    return {};
  }
  ['stmt:500:$default'](vm: ILanguageVm<PktRuntime>, scope: IScope, stmt: any, next: NextStatement): IPkStatementResult {
    if (!stmt) {
      return {};
    }
    const o: any = {};
    Object.keys(stmt)
      .filter(k => k.length == 0 || k[0] !== '/')
      .forEach(k => o[k] = stmt[k]);
    if (Object.keys(o).length != 0) {
      const object = vm.runtime.evalObject(vm, scope, o);
      if (object) {
        scope.add(object);
      }
    }
    return {};
  }
  initialState = PKT_INITIAL_STATE;
};

export const createLanguageRuntime = () => new PktRuntime();
