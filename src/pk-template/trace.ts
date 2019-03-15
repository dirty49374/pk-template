import { ITrace } from "./types";

export class Trace implements ITrace {
    private locs: any = new Array(100);
    private _depth: number = 0;
    constructor(private root: string) {
        this.locs[0] = root;
        this._depth = 0;
    }

    into<T>(stepCb: () => T): T {
        this._depth++;
        const rst = stepCb();
        this.locs[this._depth] = null;
        this._depth--;
        return rst;
    }

    step = (name: string | number) => this.locs[this._depth] = name;
    pos = () => this.locs.slice(0, this._depth + 1).join(' > ');
    depth = () => this._depth;
}
