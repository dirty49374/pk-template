import { getLiveScript, getCoffeeScript, getUnderscore } from "../lazy";
import { IScope, IValues } from "../pk-template/types";
import * as vm from 'vm';
import { tpl } from "../pk/libs";
import { parseYamlAll, parseYaml } from ".";
const _ = getUnderscore();

const compileCoffee = (data: string): string => {
  try {
    return getCoffeeScript().compile(data, { bare: true });
  } catch (e) {
    console.log('failed to compile coffee script');
    throw e;
  }
}

const compileLive = (data: string): string => {
  try {
    const bin = getLiveScript().compile(data, { bare: true, map: 'embedded' });
    return bin.code;

  } catch (e) {
    console.log('failed to compile live script');
    throw e;
  }
}

export class CustomYamlTag {
  constructor(public type: string, public src: any, public uri: string) { }
  represent = () => this.src;
  evaluate = (scope: IScope, sandbox: IValues, evaluator: any): any => {
    throw new Error('Custom Tag must implement evaluate() function');
  };
  isScript = () => false;
}

export class CustomYamlScriptTag extends CustomYamlTag {
  public script: vm.Script;
  constructor(tag: string, src: any, uri: string, compiler?: any) {
    super(tag, src, uri);

    const compiled = compiler ? compiler(src) : src;
    this.script = new vm.Script(compiled);
  }
  evaluate = (scope: IScope, sandbox: IValues, evaluator: any): any => {
    try {
      const context = vm.createContext(sandbox);
      return this.script.runInContext(context, {
        lineOffset: 0,
        displayErrors: true,
      });
    } catch (e) {
      e.source = this;
      e.sandbox = sandbox;
      throw e;
    }
  }
  isScript = () => true;
}

export class CustomYamlJsTag extends CustomYamlScriptTag {
  constructor(src: any, uri: string) {
    super('js', src, uri);
  }
}

export class CustomYamlCsTag extends CustomYamlScriptTag {
  constructor(src: any, uri: string) {
    super('cs', src, uri, compileCoffee);
  }
}

export class CustomYamlLsTag extends CustomYamlScriptTag {
  constructor(src: any, uri: string) {
    super('ls', src, uri, compileLive);
  }
}

export class CustomYamlTemplateTag extends CustomYamlTag {
  private tpl: any;
  constructor(src: any, uri: string) {
    super('template', src, uri);
    this.tpl = _.template(src);
  }
  evaluate = (scope: IScope, sandbox: IValues, evaluator: any): any => {
    return this.tpl(sandbox);
  }
}

export class CustomYamlYamlTag extends CustomYamlTag {
  private tpl: any;
  constructor(src: any, uri: string) {
    super('yaml', src, uri);
    this.tpl = _.template(src);
  }
  evaluate = (scope: IScope, sandbox: IValues, evaluator: any): any => {
    const text = this.tpl(sandbox);
    return parseYaml(text);
  }
}


export class CustomYamlFileTag extends CustomYamlTag {
  constructor(src: any, uri: string) {
    super('file', src, uri);
  }
  evaluate = (scope: IScope, sandbox: IValues, evaluator: any) => {
    const result = scope.loadText(this.src);
    return result.data;
  }
}

export class CustomYamlFlattenTag extends CustomYamlTag {
  constructor(src: any, uri: string) {
    super('flatten', src, uri);
  }
  evaluate = (scope: IScope, sandbox: IValues, evaluator: any) => {
    const list: any[] = [];
    const flattenDeep = (o: any) => {
      if (o instanceof CustomYamlTag) {
        o = o.evaluate(scope, sandbox, evaluator);
      }
      if (Array.isArray(o)) {
        o.forEach(e => flattenDeep(e));
      } else {
        list.push(o);
      }
    }
    flattenDeep(this.src);
    return list;
  }
}

export class CustomYamlTagTag extends CustomYamlTag {
  constructor(code: string, src: any, uri: string) {
    super('tag', src, uri);
  }
  execute(scope: IScope, sandbox: IValues, evaluator: any) { }
  convert() {
    const [tag, src] = this.src.split(' ', 2);
    switch (tag) {
      case '!js': return new CustomYamlJsTag(src, this.uri);
      case '!ls': return new CustomYamlLsTag(src, this.uri);
      case '!cs': return new CustomYamlCsTag(src, this.uri);
      case '!template': return new CustomYamlTemplateTag(src, this.uri);
      case '!yaml': return new CustomYamlYamlTag(src, this.uri);
      case '!file': return new CustomYamlFileTag(src, this.uri);
      case '!flatten': return new CustomYamlFlattenTag(src, this.uri);
    }
  }
}
