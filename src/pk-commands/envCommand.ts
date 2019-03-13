// import { IPkctlEnvOptions } from "./types";
// import { PktModule } from "../pk-template/module";

// class Command {
//     constructor(private options: IPkctlEnvOptions) {
//     }

//     async execute() {
//         const m = PktModule.Load(process.cwd());
//         if (!m) {
//             console.error("module not initialized");
//             process.exit(1);
//             return;
//         }
//         m.setEnv(this.options.envName, this.options.contextName);
//         m.save();
//     }
// }
// export default {
//     command: 'env <env-name> <context-name>',
//     desc: 'add or update env',
//     builder: (yargs: any) => yargs,
//     handler: (argv: any) => new Command(argv).execute(),
// };
