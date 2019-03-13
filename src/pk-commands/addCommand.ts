// import { IPkctlAddOptions } from './types';
// import { PktModule } from '../pk-template/module';

// class Command {
//     constructor(private options: IPkctlAddOptions) {
//     }

//     async execute() {
//         const m = PktModule.Load(process.cwd());
//         if (m) {
//             console.log(this.options);
//             m.addRepository(this.options.repositoryName, this.options.repositoryUri);
//             m.save();
//             console.log('added !!!');
//         }
//     }
// }

// export default {
//     command: 'add <repository-name> <repository-uri>',
//     desc: 'add a remote module',
//     builder: (yargs: any) => yargs,
//     handler: (argv: IPkctlAddOptions) => {
//         new Command(argv).execute();
//     },
// }
