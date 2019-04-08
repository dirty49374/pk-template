import { PkProjectConf } from "../pk-conf/projectConf";
import * as libs from "./libs";
import * as lazy from "../lazy";
import { generate } from "../pkt/pkt";
import * as yaml from '../pk-yaml';
import * as cmdui from '../pk-ui/cmdui';
import jsonpatch from 'json-patch';
import { loadModuleCommands, loadModuleGenerators } from "./module";
import { PkConf } from "../pk-conf/conf";
import { homedir } from "os";
import { compilePkt } from "../pk-template/languageSpec";
import { IPkCommandInfo } from "./types";

async function main(argv: string[]) {
  const conf = PkConf.load();
  const { projectRoot, projectConf } = PkProjectConf.find();

  const yargs = require('yargs')(argv)
    .scriptName("pk")

  const pk: IPkCommandInfo = {
    ...libs, ...lazy, ui: cmdui, projectRoot, projectConf, generate, yaml, jsonpatch, compilePkt
  };
  if (projectConf && projectRoot) {
    yargs
      .command(require('./commands/app').default(pk))
      .command(require('./commands/env').default(pk))
      // .command(require('./commands/deployment').default(pk))
      .command(require('./commands/deployment2').default(pk))
      ;

    if (projectConf.data.modules) {
      for (const mod of projectConf.data.modules) {
        yargs.command({
          command: `${mod.name} <command>`,
          description: `module ${mod.name} command`,
          builder: (yargs: any) => {
            loadModuleCommands(yargs, projectRoot, mod.name, pk);
            loadModuleGenerators(yargs, projectRoot, mod.name, pk);
          }
        });
      }
    }

  } else {
    yargs
      .command(require('./commands/init').default(pk));
  }

  if (conf && conf.data && conf.data.modules) {
    for (const mod of conf.data.modules) {
      yargs.command({
        command: `${mod.name} <command>`,
        description: `module ${mod.name} command`,
        builder: (yargs: any) => {
          loadModuleCommands(yargs, homedir(), mod.name, pk);
          loadModuleGenerators(yargs, homedir(), mod.name, pk);
        }
      });
    }
  }

  yargs
    .command(require('./commands/module').default(pk))
    .command(require('./commands/config').default(pk))
    .option('d', { description: 'enable stacktrace on error', boolean: true })
    .recommendCommands()
    .demandCommand()
    .strict()
    .help('h')
    .argv
    ;
}

main(process.argv.slice(2));
