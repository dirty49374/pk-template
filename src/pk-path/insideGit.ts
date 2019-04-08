import { findFileUpward } from "./findFileUp";

export const insideGit = () => {
  return findFileUpward('.git');
}
