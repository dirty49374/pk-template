import { execSync } from "child_process";
import { join } from "path";

export interface IPkModule {
    name: string;
    repository: string;
    branch?: string;
    tag?: string;
}

export class PkModuleHelper {
    moduleDir: string;
    constructor(private projectDir: string, private module: IPkModule) {
        this.moduleDir = `pk_modules/${this.module.name}`;
    }

    clone() {
        process.chdir(this.projectDir);

        console.log('* adding submodule ...')
        const cmd = `git submodule add ${this.module.repository} ${this.moduleDir}`;
        console.log(cmd);

        execSync(cmd);

        process.chdir(this.moduleDir);
        if (this.module.branch) {
            console.log(`* checking out ${this.module.branch} branch ...`)
            execSync(`git checkout ${this.module.branch}`)
        } else if (this.module.tag) {
            console.log(`* checking out tags/${this.module.tag} tag ...`)
            execSync(`git checkout ${this.module.tag}`)
        }

        console.log(`* done`);
    }

    update() {
        process.chdir(join(this.projectDir, this.moduleDir));

        console.log('* fetching submodule ...')
        const cmd = `git fetch --all`;
        execSync(cmd);

        if (this.module.branch) {
            execSync(`git reset --hard `);
            execSync(`git checkout ${this.module.branch}`);
            execSync(`git reset --hard remotes/origin/${this.module.branch}`);
            //execSync(`git pull --ff-only`);
        } else if (this.module.tag) {
            console.log(`* checking out ${this.module.tag} tag ...`)
            execSync(`git reset --hard`);
            execSync(`git checkout tags/${this.module.tag}`)
        }
    }
}
