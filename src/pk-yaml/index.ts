import jsyaml from 'js-yaml';
import { pktYamlOption } from './yamls';
export { CustomYamlTag } from './types';


export const loadYaml = (text: string): any => jsyaml.load(text);
export const loadYamlAll = (text: string): any[] => jsyaml.loadAll(text);
export const loadYamlAsPkt = (text: string): any => jsyaml.load(text, pktYamlOption);

export const dumpYaml = (o: any) => jsyaml.dump(o);
export const dumpYamlSortedKey = (o: any) => jsyaml.dump(o, { sortKeys: true });
export const dumpYamlAll = (arr: any[]) => {
    return arr.map(o => jsyaml.dump(o, { sortKeys: true }))
        .filter(o => o != null)
        .join('---\n');
}
