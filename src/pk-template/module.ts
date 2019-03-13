// import fs from "fs";
// import url from "url";
// import path from "path";
// import jsyaml from "js-yaml";
// import { IPktModule, IPktModuleLoaded, PKMODULE_FILE_NAME } from "./types";

// export class PktModule {
//     public homeUri: string;
//     constructor(public uri: string, public module: IPktModule) {
//         this.homeUri = path.dirname(uri);
//     }

//     addRepository(repositoryName: string, repositoryUri: string): any {
//         if (!this.module.repositories) {
//             this.module.repositories = {};
//         }
//         this.module.repositories[repositoryName] = repositoryUri;
//     }

//     setEnv(name: string, context: string) {
//         if (!this.module.envs) {
//             this.module.envs = [];
//         }

//         const env = this.module.envs.find(e => e.name == name);
//         if (env) {
//             env.context = context;
//         } else {
//             this.module.envs.push({ name, context, data: {} })
//         }
//     }

//     resolve(mpath: string) {
//         const rpath = mpath.substring(1);
//         const spl = rpath.split('/');
//         const ruri = this.module.repositories[spl[0]];
//         if (ruri) {
//             const uri = url.resolve(this.uri, ruri);
//             spl.shift();
//             const final = path.join(uri, spl.join('/'));
//             return final;
//         }
//         return path.join(this.homeUri, rpath);
//     }

//     save() {
//         console.log('save')
//         const json = jsyaml.dump(this.module);
//         fs.writeFileSync(this.uri, json, 'utf8');
//     }

//     static TryLoadModule(uri: string): string | null {
//         try {
//             const json = fs.readFileSync(uri, 'utf8');
//             return json;
//         } catch (e) {
//             return null;
//         }
//     }

//     static FindPkModuleYaml(uri: string): IPktModuleLoaded | null {
//         uri = uri.startsWith('https://') || uri.startsWith('http://')
//             ? `${uri}/`
//             : url.resolve(process.cwd(), uri) + '/';
//         while (true) {
//             let u = url.resolve(uri, PKMODULE_FILE_NAME);
//             const json = PktModule.TryLoadModule(u);
//             if (json) {
//                 // if (!path.isAbsolute(u) && u[0] != '.') {
//                 //     u = './' + u;
//                 // }
//                 return { module: jsyaml.load(json) as any, uri: u };
//             }

//             const parent = url.resolve(uri, '../');
//             if (parent == null || parent === uri) {
//                 return null;
//             }

//             uri = parent;
//         }
//     }

//     static Load(uri: string): PktModule | null {
//         const loaded = PktModule.FindPkModuleYaml(uri);
//         return loaded
//             ? new PktModule(loaded.uri, loaded.module)
//             : null;
//     }
// }
