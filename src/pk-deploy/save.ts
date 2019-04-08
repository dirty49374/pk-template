import fs from 'fs';
import { IPkDeployment } from '.';
import { dumpYamlAll } from '../pk-yaml';

export const savePkd = (pkz: IPkDeployment) => {
  const yaml = dumpYamlAll(pkz.objects);
  fs.writeFileSync(`${pkz.header.env}-${pkz.header.cluster}.pkd`, yaml, 'utf8');
}
