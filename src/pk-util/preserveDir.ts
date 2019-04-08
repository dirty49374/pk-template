export const preserveDir = async (cb: any) => {
  const cwd = process.cwd();
  try {
    const rst = await cb();
    process.chdir(cwd);
    return rst;
  } catch (e) {
    process.chdir(cwd);
    throw e;
  }
}
