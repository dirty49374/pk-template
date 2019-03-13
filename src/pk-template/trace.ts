import { ITrace } from "./types";

export class Trace implements ITrace {
    private locs: any = new Array(100);
    private depth: number = 0;
    constructor(private root: string) {
        this.locs[0] = root;
        this.depth = 0;
    }

    into<T>(stepCb: () => T): T {
        this.depth++;
        const rst = stepCb();
        this.locs[this.depth] = null;
        this.depth--;
        return rst;
    }

    step(name: string | number) {
        this.locs[this.depth] = name;
    }

    pos() {
        return this.locs.slice(0, this.depth + 1).join(' > ');
    }
}
