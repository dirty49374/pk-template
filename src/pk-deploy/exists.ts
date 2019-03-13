import fs from 'fs';
import { IPkDeployment } from '.';

export const existsPkd = (name: string): boolean => {
    return fs.existsSync(`${name}.pkd`);
}
