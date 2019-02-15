import { IObject } from "../../common";

export interface IOutput {
    write(objects: IObject): Iterator<string>;
}
