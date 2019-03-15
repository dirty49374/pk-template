import fs from 'fs';
import { basename } from "path";
import { IPkDeployment } from '.';
import { parseYaml, parseYamlAll } from '../pk-yaml';

export const deserializePkd = (path: string, text: string): IPkDeployment => {
    const isDeploymentConfigMap = (o: any) => o && o.metadata &&
        o.metadata.annotations &&
        o.metadata.annotations['pkt.io/type'] == 'pk-deployment';

    const objects = parseYamlAll(text);
    const header = parseYaml(objects.find(isDeploymentConfigMap).data.header);
    const deployment: IPkDeployment = {
        header: header,
        objects: objects,
    };

    return deployment;
};

export const loadPkd = (path: string): IPkDeployment => {
    const text = fs.readFileSync(`${path}.pkd`, 'utf8');
    return deserializePkd(path, text);
};
