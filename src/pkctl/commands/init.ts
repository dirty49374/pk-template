import { IPkctlDiffOptions } from "../types";
import fs from 'fs';
import { IPktModule, PKMODULE_FILE_NAME, PKTLIBS_DIR_NAME } from "../../pk-lib/types";

export class InitCommand {
    constructor(private options: IPkctlDiffOptions) {
    }

    async execute() {
        const module: IPktModule = {
            repositories: {},
        }
        const json = JSON.stringify(module, null, 4);

        try {
            if (fs.existsSync(PKMODULE_FILE_NAME)) {
                console.log(`${PKMODULE_FILE_NAME} exists`);
            } else {
                fs.writeFileSync(PKMODULE_FILE_NAME, json, 'utf8');
                console.log(`${PKMODULE_FILE_NAME} created`);
            }
            if (fs.existsSync(PKTLIBS_DIR_NAME)) {
                console.log(`${PKTLIBS_DIR_NAME} exists`);
            } else {
                fs.mkdirSync(PKTLIBS_DIR_NAME);
                console.log(`${PKTLIBS_DIR_NAME}/ created`);
            }
        } catch (e) {
        }
        console.log('module initialized');
    }
}
