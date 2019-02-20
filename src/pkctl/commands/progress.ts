import { getReadlineSync, getChalk } from "../../pk-lib/lazy";
import { ApplyConfig, IPkctlOptions } from "../types";
import { IProgress } from "../../common";

export class Progress implements IProgress {
    constructor(protected baseOptions: IPkctlOptions) { }

    header(message: string) {
        this.info();
        this.info(`### ${message}`);
    }

    confirm(msg: string) {
        if (!this.baseOptions.yes) {
            const chalk = this.baseOptions.dryRun
                ? getChalk().green
                : getChalk().red;
            const prompt = getChalk().magenta(
                `==> are you sure to ${chalk(msg)} ? [ENTER/CTRL-C] `
            );
            getReadlineSync().question(prompt);

            process.stdout.write('\x1B[1A');
            (process.stdout as any).clearLine();
        };
    }

    private write(chalk: any, msg?: string) {
        if (msg === undefined) {
            console.log();
        } else {
            console.log(chalk ? chalk(msg) : msg);
        }
    }

    info(msg?: string) {
        this.write(getChalk().whiteBright, msg);
    }

    output(msg?: string) {
        this.write(null, msg);
    }

    verbose(msg?: string) {
        this.write(getChalk().gray, msg);
    }

    success(msg?: string) {
        this.write(getChalk().green, msg);
    }

    warning(msg?: string) {
        this.write(getChalk().magenta, msg);
    }

    error(msg?: string) {
        this.write(getChalk().red, msg);
    }
}
