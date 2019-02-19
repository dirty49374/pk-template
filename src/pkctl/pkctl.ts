import { ApplyConfig } from './types';
import { PkgApply } from './apply';

export class PktCtl {
    parseArgs(argv: string[]) {
        const yargv = require('yargs/yargs')(argv)
            .boolean(['apply', 'single', 'yes'])
            .argv

        return {
            target: yargv._[0],
            apply: yargv.apply,
            yes: yargv.yes,
            single: !!yargv.single,
        }
    }

    buildApplyOption(config: ApplyConfig, args: any) {
        let option = ''
        if (config.kubeconfig)
            option += ` --kubeconfig ${config.kubeconfig}`;
        if (config.context)
            option += ` --context ${config.context}`;
        if (config.cluster)
            option += ` --cluster ${config.cluster}`;

        config.kube_option = option;
        if (args.apply) {
            config.apply = args.apply;
        }

        config.already_confirmed = !!args.yes;
        if (!config.apply) {
            config.kube_dryrun_option = ' --dry-run';
            // config.already_confirmed = true;
        }

        config.sequential_apply = !!args.single;

        return option;
    }

    async pktctl(argv: string[]) {
        const args = this.parseArgs(argv);
        if (!args.target) {
            console.log('useage: pkt-apply yaml_path [ --apply | --yes | --single ]')
            return;
        }

        const config: ApplyConfig = {
            target: args.target,
            kubeconfig: '',
            context: '',
            cluster: '',
            apply: false,
            kube_option: '',
            kube_dryrun_option: '',
            sequential_apply: false,
            unnamespaced: [],
            already_confirmed: false,
        };
        this.buildApplyOption(config, args);

        await new PkgApply(config).exec(args.target);
    }
}
