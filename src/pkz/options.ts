import { IProgressOptions } from "../pkctl/types";

export interface IPkzApplierOption extends IProgressOptions {
    // packageName: string;
    immediate?: boolean;
}
