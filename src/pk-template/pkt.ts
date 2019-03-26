import { LanguageVm } from "./virtualMachine";
import { languageSpec, IValues } from ".";
import { IObject } from "../common";
import { Scope } from "./scope";

export const executePkt = (objects: IObject[], values: IValues, file: string) => {
    objects = objects || [];
    const scope = Scope.CreateRoot(objects, values);
    LanguageVm.Run(languageSpec, scope, file);

    return scope.objects;
}
