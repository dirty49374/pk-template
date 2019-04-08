import { getChalk, getReadlineSync } from "../lazy";
import { execSync, exec as child_process_exec } from "child_process";

const chalk = getChalk();
const readline = getReadlineSync();

export const read = (msg: string, name?: string) => {
  console.log();
  console.log(chalk.green(`${msg} [no = skip]`));
  while (true) {
    const rst = readline.question(`  ${name || 'enter'}: `);
    if (rst) {
      if (rst.toLowerCase() == 'no' || rst.toLowerCase() == 'n') {
        return null;
      }
      return rst;
    }
  }
}

export const readAlphaNumeric = (msg: string, name?: string) => {
  console.log();
  console.log(chalk.green(`${msg} [ anpha-numeric chars only ]`));
  while (true) {
    const input = readline.question(chalk.white(`  ${name || 'enter'}: `));
    if (input.match(/^[a-zA-Z0-9]+$/)) {
      return input;
    }
  }
}

export const choose = (msg: string, list: string[], name?: string) => {
  console.log();
  console.log(chalk.green(`${msg} [ ${list.map(f => `'${f}'`).join(', ')} ]`));
  while (true) {
    const selection = readline.question(`  ${name || 'enter'}: `);
    if (list.includes(selection)) {
      return selection;
    }
  }
}

export const confirm = (msg: string, name?: string) => {
  console.log();
  console.log(chalk.green(`${msg} [yes/no, enter = yes]`));

  while (true) {
    const input = readline.question(chalk.white(`  ${name || 'enter'}: `)).toLowerCase();
    if (!input || input == 'yes' || input == 'y') {
      return true;
    }
    if (input == 'no' || input == 'n') {
      return false;
    }
  }
}

export const skip = () => {
  console.log(chalk.grey('    skipped !!!'));
}

export const success = (msg: string) => {
  console.log(chalk.grey(`    ${msg} !!!`));
}

export const exec = async (command: string) => {
  console.log(chalk.grey(`    * exec: ${command}`));
  console.log();
  return new Promise((resolve, reject) => {
    try {
      const ps = child_process_exec(command);
      process.stdout.write('    ');
      const cb = (data: string) => {
        const indented = data.replace(/\n/g, '\n    ');
        process.stdout.write(chalk.grey(indented));
      }
      ps.stdout.on('data', cb);
      ps.stderr.on('data', cb);
      ps.on('close', code => {
        console.log();
        if (code == 0) {
          resolve();
        }
        reject(new Error(`process exited with code = ${code}`));
      });
    } catch (e) {
      reject(e);
    }
  });
}
