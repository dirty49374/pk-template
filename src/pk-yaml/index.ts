import fs from "fs";
import url from 'url';
import jsyaml from 'js-yaml';
import { pktYamlOption } from './yamls';
import { getSyncRequest } from '../lazy';
import { hackedDump } from "./hackedDump";

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
export const parseYaml = (text: string, uri?: string): any => jsyaml.load(text, pktYamlOption(uri || '.'));
export const parseYamlAll = (text: string, uri?: string): any[] => jsyaml.loadAll(text, undefined, pktYamlOption(uri || '.'));
export const parseYamlAsPkt = (text: string, uri: string): any => jsyaml.load(text, pktYamlOption(uri));

export const dumpYaml = (o: any) => {
    return hackedDump(o, pktYamlOption('.'));
}
export const dumpYamlSortedKey = (o: any) => hackedDump(o, { sortKeys: true });
export const dumpYamlAll = (arr: any[], uri?: string) => {
    return arr.map(o => hackedDump(o, pktYamlOption(uri || '.')))
        .filter(o => o != null)
        .join('---\n');
}
