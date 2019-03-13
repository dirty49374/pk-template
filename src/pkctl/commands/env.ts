import { IPkctlEnvOptions } from "../types";
import fs from 'fs';
import path from 'path';
import { PktModule } from "../../pk-lib/module";

class Command {
    constructor(private options: IPkctlEnvOptions) {
    }

    async execute() {
        const m = PktModule.Load(process.cwd());
        if (!m) {
            console.error("module not initialized");
            process.exit(1);
            return;
        }
        m.setEnv(this.options.envName, this.options.contextName);
        m.save();
    }
}
export const EnvCommand = {
    command: 'env <env-name> <context-name>',
    desc: 'add or update env',
    builder: (yargs: any) => yargs,
    handler: (argv: any) => new Command(argv).execute(),
};
