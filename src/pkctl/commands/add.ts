import { IPkctlAddOptions } from "../types";
import fs from 'fs';
import path from 'path';
import { PktModule } from "../../pk-lib/module";

class Command {
    constructor(private options: IPkctlAddOptions) {
    }

    async execute() {
        const m = PktModule.Load(process.cwd());
        if (m) {
            console.log(this.options);
            m.addRepository(this.options.repositoryName, this.options.repositoryUri);
            m.save();
            console.log('added !!!');
        }
    }
}

export const AddCommand = {
    command: 'add <repository-name> <repository-uri>',
    desc: 'add a remote module',
    builder: (yargs: any) => yargs,
    handler: (argv: IPkctlAddOptions) => {
        new Command(argv).execute();
    },
}
