import { IProgressOptions } from "../pk-commands/types";

export interface IPkzApplierOption extends IProgressOptions {
    // packageName: string;
    immediate?: boolean;
}
