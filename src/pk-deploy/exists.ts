import fs from 'fs';

export const existsPkd = (env: string, cluster: string): boolean => {
    return fs.existsSync(`${env}-${cluster}.pkd`);
}
