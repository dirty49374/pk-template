import { LanguageVm } from "./virtualMachine";
import { createLanguageRuntime, IValues } from ".";
import { IObject } from "../common";
import { Scope } from "./scope";

export const executePkt = (objects: IObject[], values: IValues, file: string) => {
  objects = objects || [];
  const scope = Scope.CreateRoot(objects, values);
  const runtime = createLanguageRuntime();
  LanguageVm.Run(runtime, scope, file);

  return scope.objects;
}
