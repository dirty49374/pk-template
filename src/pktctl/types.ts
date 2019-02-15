import { IResourceType, IKubeCtlConfig } from "../common";

export interface ApplyConfig extends IKubeCtlConfig {
    target: string;
    apply: boolean;
    unnamespaced: IResourceType[];
    already_confirmed: boolean;
    // [ key: string ]: string;
}
