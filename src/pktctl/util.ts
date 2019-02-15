import jsyaml from 'js-yaml';
import { execSync } from 'child_process';
import { getChalk } from '../pktlib/lazy';

// const kubectlQuerySpec = (name: string, config: any): string => {
//     const command = `kubectl get configmap ${name} ${config.kube_option} --namespace default`;
//     console.log(command);
//     try {
//         const opt: any = { stdio: [ 'pipe', 'pipe', 'pipe' ]};
//         const result = execSync(command, opt);

//         return result.toString();
//     } catch (e) {
//         if (e.message.includes("No resources found.")) {
//             return '';
//         }
//         process.exit(1);
//         throw new Error('impossible');
//     }
// }
