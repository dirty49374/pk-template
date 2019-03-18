import { IPkModule } from '.';
import { execSync } from 'child_process';
import { preserveDir } from '../pk-util/preserveDir';

export const MODULE_DIR = 'pk-modules';

export const cloneModule = async (module: IPkModule, isGlobal: boolean) => {
    await preserveDir(async () => {
        const moduleDir = `${MODULE_DIR}/${module.name}`;

        console.log('* cloning module ...')
        const cmd = isGlobal
            ? `git clone ${module.repository} ${moduleDir}`
            : `git submodule add ${module.repository} ${moduleDir}`;
        console.log(cmd);

        execSync(cmd);

        process.chdir(moduleDir);
        if (module.branch) {
            console.log(`* checking out ${module.branch} branch ...`)
            execSync(`git checkout ${module.branch}`)
        } else if (module.tag) {
            console.log(`* checking out tags/${module.tag} tag ...`)
            execSync(`git checkout ${module.tag}`)
        }

        console.log(`* done`);
    });
}

export const updateModule = async (module: IPkModule) => {
    await preserveDir(() => {

        const moduleDir = `${MODULE_DIR}/${module.name}`;
        process.chdir(moduleDir);

        console.log('* fetching submodule ...')
        const cmd = `git fetch --all`;
        execSync(cmd);

        if (module.branch) {
            execSync(`git reset --hard `);
            execSync(`git checkout ${module.branch}`);
            execSync(`git reset --hard remotes/origin/${module.branch}`);
            //execSync(`git pull --ff-only`);
        } else if (module.tag) {
            console.log(`* checking out ${module.tag} tag ...`)
            execSync(`git reset --hard`);
            execSync(`git checkout tags/${module.tag}`)
        }
    });
}
