import fs from 'fs';
import { basename } from "path";
import { IPkDeployment } from '.';
import { parseYaml, parseYamlAll } from '../pk-yaml';

export const deserializePkd = (path: string, clustr: string, text: string): IPkDeployment => {
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

export const loadPkd = (env: string, cluster: string): IPkDeployment => {
    const text = fs.readFileSync(`${env}.pkd`, 'utf8');
    return deserializePkd(env, cluster, text);
};
