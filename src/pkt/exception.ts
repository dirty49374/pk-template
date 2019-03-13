import fs from 'fs';
import path from 'path';
import { extractSourceMap } from '../pk-template/sourceMap';

import { getChalk, getSourceMap } from "../pk-template/lazy";

const extractSourceAndLocation2 = async (name: string, file: string, line: number, column: number): Promise<{ name: string, file: string, line: number, column: number }> => {
    try {
        const source = fs.readFileSync(file, 'utf8');
        const smap = extractSourceMap(source);
        if (smap) {
            const consumer = await new (getSourceMap()).SourceMapConsumer(smap);
            const pos = consumer.originalPositionFor({ line, column })
            return { name: pos.name, file: pos.source, line: pos.line, column: pos.column }
        }
        return { name, file, line, column };
    } catch (e) {
        return { name, file, line, column };
    }
}

const extractSourceAndLocation = async (source: string, line: number, column: number): Promise<any> => {
    const smap = extractSourceMap(source);
    if (smap) {
        const consumer = await new (getSourceMap()).SourceMapConsumer(smap);
        const orig = consumer.originalPositionFor({ line, column })
        return { source: smap.sourcesContent[0], line: orig.line, column: orig.column };
    } else {
        return { source: source, line: line, column: column };
    }
}

const showErrorLocation = async (source: string, line: number, column: number): Promise<any> => {
    const loc = await extractSourceAndLocation(source, line, column);
    if (loc.source) {
        const lines = loc.source.split('\n');
        const from = Math.max(0, loc.line - 4);
        const to = Math.min(loc.line + 5, lines.length);

        const grey = getChalk().grey;
        const red = getChalk().red;

        for (let i = from; i < to; ++i) {
            const ln = `${i + 1} | `.padStart(7, ' ');
            if (i + 1 == loc.line) {
                console.error('|' + ln + lines[i]);
                console.error('|' + grey('     | ') + "".padStart(loc.column - 1, ' ') + red('^------------ here !!!'));
            } else {
                console.error('|' + grey(ln + lines[i]));
            }
        }
        return true;
    }
    return false;
}

const showStack = async (stack: string, source?: string) => {
    const chalk = getChalk();
    console.error('+ ' + chalk.yellow('STACK TRACE:'));

    const lines = stack.split('\n');
    let isFirstAnonymous = true;

    for (const l of lines) {
        if (l.length === 0 || l[0] !== ' ') {
            console.error('|', l);
            continue;
        }
        const match = l.match(/at (.*)\s*\((.+):(\d+):(\d+)\)/);
        if (!match) {
            console.error('|' + l);
            if (source && isFirstAnonymous) {
                const match = l.match(/evalmachine\.<anonymous>:(\d+):(\d+)/);
                if (match) {
                    isFirstAnonymous = false;
                    const line = Number(match[1]);
                    const column = Number(match[2]);
                    await showErrorLocation(source, line, column);
                }
            }
            continue;
        }

        const name = match[1];
        const file = match[2];
        const line = Number(match[3]);
        const column = Number(match[4]);
        const orig = await extractSourceAndLocation2(name, file, line, column);
        if (file !== orig.file) {
            console.error('|    at', `${chalk.yellow(name)}(${path.dirname(orig.file)}/${chalk.yellow(path.basename(orig.file))}:${orig.line}:${orig.column})`);
        } else {
            console.error('|    at', `${name}(${orig.file}:${orig.line}:${orig.column})`);
        }
    }
}

export const exceptionHandler = async (e: any): Promise<any> => {
    const chalk = getChalk();
    console.error(chalk.red('ERROR  : ' + e.message));
    if (e.summary) {
        console.error(chalk.red('         ' + e.summary + ' in ' + e.uri));
    }
    if (e.pos) {
        console.error(chalk.red('         ' + e.pos));
    }
    console.error();
    await showStack(e.stack, e.source);

    process.exit(1);
}
