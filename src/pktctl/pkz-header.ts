import { IPkzHeader } from "../common";

const pkzheader = {
    patterns: {
        '# KUBE_CONFIG=': (config: IPkzHeader, v: string) => config.kubeconfig = v,
        '# KUBE_CONTEXT=': (config: IPkzHeader, v: string) => config.context = v,
        '# KUBE_CLUSTER=': (config: IPkzHeader, v: string) => config.cluster = v,
    } as any,
    parse(content: string, config: IPkzHeader) {
        const lines = content.split('\n');
        for (const line of lines) {
            if (!line.startsWith('#'))
                return;

            for (const pattern in pkzheader.patterns) {
                if (line.startsWith(pattern)) {
                    const value = line.substr(pattern.length).trim();
                    const setter = pkzheader.patterns[pattern];
                    setter(config, value);
                }
            }
        }
    }
}

export default pkzheader;
