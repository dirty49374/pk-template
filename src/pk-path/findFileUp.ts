import { resolve } from "url";
import { resolve as pathResolve } from "path";
import { existsSync } from "fs";
import { isHttp } from "./isHttp";

const _findFileUpward = (filename: string, dir: string): string | null => {
  if (!dir.endsWith('/')) {
    dir = dir + '/';
  }
  while (true) {
    const path = resolve(dir, filename);
    if (existsSync(path)) {
      return path;
    }

    const parent = resolve(dir, '../');
    if (parent == null || parent === dir) {
      return null;
    }

    dir = parent;
  }
}

export const findFileUpward = (file: string, dir?: string) => {
  const absolute = dir
    ? (isHttp(dir) ? dir : pathResolve(dir))
    : process.cwd();
  return _findFileUpward(file, absolute);
}
