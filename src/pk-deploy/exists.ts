import fs from 'fs';

export const existsPkd = (name: string): boolean => {
    return fs.existsSync(`${name}.pkd`);
}
