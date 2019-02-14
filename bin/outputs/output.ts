import { IObject } from "../../lib";

export interface IOutput {
    write(objects: IObject): Iterator<string>;
}
