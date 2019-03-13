import fs from "fs";
import url from 'url';
import jsyaml from 'js-yaml';
import { pktYamlOption } from './yamls';
import { getSyncRequest } from '../lazy';

function isHttp(uri: string): boolean {
    const supportedProtocols = ['http:', 'https:'];
    const parsed = url.parse(uri);
    return supportedProtocols.some(protocol => protocol == parsed.protocol);
}

const loadFile = (uri: string): string => {
    try {
        return isHttp(uri)
            ? getSyncRequest()('GET', uri).getBody('utf8')
            : fs.readFileSync(uri, 'utf8');
    } catch (e) {
        throw new Error(`failed to load ${uri}`);
    }
}
export const loadYamlFile = (file: string): any => jsyaml.load(loadFile(file));
export const parseYaml = (text: string): any => jsyaml.load(text);
export const parseYamlAll = (text: string): any[] => jsyaml.loadAll(text);
export const parseYamlAsPkt = (text: string, uri: string): any => jsyaml.load(text, pktYamlOption(uri));

export const dumpYaml = (o: any) => jsyaml.dump(o);
export const dumpYamlSortedKey = (o: any) => jsyaml.dump(o, { sortKeys: true });
export const dumpYamlAll = (arr: any[]) => {
    return arr.map(o => jsyaml.dump(o, { sortKeys: true }))
        .filter(o => o != null)
        .join('---\n');
}
