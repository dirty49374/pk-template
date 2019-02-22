import { IPkctlAddOptions } from "../types";
import fs from 'fs';
import path from 'path';
import { PktModule } from "../../pk-lib/module";

export class AddCommand {
    constructor(private options: IPkctlAddOptions) {
    }

    async execute() {
        const m = PktModule.Load(process.cwd());
        if (m) {
            console.log(this.options);
            m.add(this.options.repositoryName, this.options.repositoryUri);
            m.save();
            console.log('added !!!');
        }
    }
}
