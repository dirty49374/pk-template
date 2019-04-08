import { IPkEnv } from "../pk-conf";

export const matchBranchIfExist = (env: IPkEnv | undefined, branch: string | undefined): boolean => {
  if (!env) {
    return false;
  }

  if (!branch) {
    return true;
  }

  return env.branch === branch;
}
