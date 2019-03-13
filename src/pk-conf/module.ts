import { execSync } from "child_process";
import { join } from "path";
import { IPkModule } from ".";


export const cloneModule = (module: IPkModule) => {
    const moduleDir = `pk_modules/${module.name}`;

    console.log('* adding submodule ...')
    const cmd = `git submodule add ${module.repository} ${moduleDir}`;
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
}

export const updateModule = (module: IPkModule) => {
    const moduleDir = `pk_modules/${module.name}`;
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
}
