import { IStyle } from "../types";

const createEmptyStyle = (type: string): IStyle => {
  const style: any = [];
  style.name = null;
  style.type = type;

  style.toMap = function () {
    return this.reduce((sum: any, kv: any) => { sum[kv.k] = kv.v; return sum; }, {});
  };
  style.toMMap = function () {
    return this.reduce((sum: any, kv: any) => { sum[kv.k] = (sum[kv.k] || []).push(kv.v); return sum; }, {});
  };
  style.parseName = function () {
    const [names, type] = this.name.split('#', 2);
    const [w1, w2] = names.split('/', 2);

    return {
      name: w2 ? w2 : w1,
      namespace: w2 ? (w1 || null) : null,
      type,
    }
  };

  return style;
}

function* parseStyleString(styleType: string, s: string): Iterator<IStyle> {

  let i = 0;

  const end = () => i >= s.length;
  const isSpace = () => s[i] === ' ' || s[i] === '\t' || s[i] === '\r' || s[i] === '\n';
  const isLParen = () => s[i] === '(';
  const isCommaRParen = () => s[i] === ',' || s[i] === ')';
  const isEscLParen = () => i + 1 < s.length && s[i] === '\\' && s[i + 1] == '(';
  const isEscCommaRParen = () => i + 1 < s.length && s[i] === '\\' && (s[i + 1] === ',' || s[i + 1] === ')');
  const skipws = () => {
    while (!end()) {
      if (!isSpace())
        return true;
      i++;
    }
    return false;
  }

  const debug = false;
  const log = (x: string, w: string) => console.log(x, '>>', i, `|${w}|`, `${s.substr(i)}`);

  const getWordL = () => {
    let w = '';
    while (!end() && !isSpace() && !isLParen()) {
      if (isEscLParen()) {
        i++;
      }
      w += s[i++];
    }
    if (debug) log('arg ', w);
    return w;
  }
  const getWordCR = () => {
    let w = '';
    while (!end() && !isCommaRParen()) {
      if (isEscCommaRParen()) {
        i++;
      }
      w += s[i++];
    }
    if (debug) log('args', w);
    return w;
  }


  while (true) {
    if (!skipws())
      return;

    const style: IStyle = createEmptyStyle(styleType);
    style.name = getWordL();

    if (!skipws()) {
      yield style;
      return;
    }

    if (isLParen()) {
      i++;
      if (!skipws()) {
        throw new Error(`malformed style 1 '${s}'`);
      }

      while (true) {
        const w = getWordCR().trim(); // eol | ',' | ')'
        if (end()) {
          throw new Error(`malformed style 2 '${s}'`);
        }
        const sp = w.split('=', 2);
        style.push({ k: sp[0], v: sp.length == 1 ? sp[0] : sp[1], kv: w });
        if (s[i++] === ')') {
          break;
        }
        if (!skipws()) {
          throw new Error(`malformed style 3 '${s}'`);
        }
      }

      yield style;
    } else {
      yield style;
    }
  }
}

export function parseParametericStyle(styleType: string, style: any): IStyle[] {
  const styles: IStyle[] = []
  if (Array.isArray(style)) {
    for (const line of style) {
      const it = parseStyleString(styleType, line.toString());
      while (true) {
        const r = it.next();
        if (r.done) {
          break;
        }
        r.value.type = styleType;
        styles.push(r.value);
      }
    }
  } else {
    const it = parseStyleString(styleType, style.toString());
    while (true) {
      const r = it.next();
      if (r.done) {
        break;
      }
      r.value.type = styleType;
      styles.push(r.value);
    }
  }

  return styles;
}

export const parseEmptyStyles = (line: string): IStyle[] => {
  return line.split(/\s+/)
    .filter((p: string) => p)
    .map(createEmptyStyle);
}
