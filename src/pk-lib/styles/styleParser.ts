import { IStyle } from "../types";

function* parseStyleString(s: string): Iterator<IStyle> {

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

        const style: any = [];
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
                const [k, v] = w.split('=', 2);
                style.push({ k, v, kv: w });
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

export function parseStyle(style: any): IStyle[] {
    const styles: IStyle[] = []
    if (Array.isArray(style)) {
        for (const line of style) {
            // const type = typeof line;
            // if (type !== 'string') {
            //     throw new Error('malformed style ${type} type args');
            // }
            const it = parseStyleString(line.toString());
            while (true) {
                const r = it.next();
                if (r.done) {
                    break;
                }
                styles.push(r.value);
            }
        }
    } else {
        // const type = typeof style;
        // if (type !== 'string') {
        //     throw new Error(`malformed style ${type} type args`);
        // }
        const it = parseStyleString(style.toString());
        while (true) {
            const r = it.next();
            if (r.done) {
                break;
            }
            styles.push(r.value);
        }
    }

    return styles;
}
