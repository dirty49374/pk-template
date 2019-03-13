import fs from 'fs';
import { IPkDeployment } from '.';

export const existsPkd = (pkz: IPkDeployment): boolean => {
    return fs.existsSync(`${pkz.header.env.name}.pkz`);
}
