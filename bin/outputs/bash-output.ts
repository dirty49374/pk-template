import jsyaml from 'js-yaml';
import { IOutput } from "./output";
import { IObject, IOptions } from "../../lib";

interface ApplyStep {
    name: string;
    objects: IObject[];
}

export class BashOutput implements IOutput {
    constructor(private options: IOptions) {
    }

    private buildSteps(objects: IObject[]): ApplyStep[] {
        const g: ApplyStep[] = [
            { name: 'Namespaces', objects: [] },
            { name: 'Resources', objects: [] },
            { name: 'Deployments', objects: [] },
        ];

        for (const o of objects) {
            switch (o.kind) {
                case 'Namespace':
                    g[0].objects.push(o);
                    break;

                case 'Pod':
                case 'Deployment':
                case 'DaemonSet':
                case 'StatefulSet':
                    g[2].objects.push(o);
                    break;

                default:
                    g[1].objects.push(o);
            }
        }

        return g;
    }
    stringOption(varName: string, optionName: string, optionValue: string | undefined): any {
        const option = optionValue
            ? `--${optionName} ${optionValue} `
            : '';
        return `${varName}="${option}" `;
    }
    *write(objects: IObject[]): Iterator<string> {

        yield `#!/bin/sh`
        yield ''

        yield this.stringOption('KUBE_CONFIG', 'kubeconfig', this.options.kubeconfig);
        yield this.stringOption('KUBE_CONTEXT', 'context', this.options.kubecontext);
        yield this.stringOption('KUBE_CLUSTER', 'cluster', this.options.kubecluster);
        yield this.stringOption('KUBE_NAMESPACE', 'namespace', this.options.kubenamespace);

        yield `
CMD=""
NEEDS_CONFIRM="yes"

help() {
    EXE="$(basename $0)"
    echo
    echo "usage: $EXE command [ options ]"
    echo "command:"
    echo "   dry     : kubectl apply --dry-run ..."
    echo "   apply   : kubectl apply ..."
    echo "   show    : show yamls"
    echo "   help    : this screen"
    echo
    echo "options:"
    echo "   --yes   : apply without confirm"
    echo "   --help  : this screen"
    echo
    exit
}

parse_args() {
    for i in "$@"
    do
    case $i in
        show)    CMD="show";  DRYRUN=""; NEEDS_CONFIRM="no"; shift; ;;
        dry)     CMD="apply"; DRYRUN="--dry-run "; shift ;;
        apply)   CMD="apply"; DRYRUN=""; shift ;;
        --yes)   NEEDS_CONFIRM="no"; shift ;;
        --help)  help ;;
        *)       help ;;
    esac
    done

    KUBE_OPTIONS="$DRYRUN$KUBE_CONFIG$KUBE_CONTEXT$KUBE_CLUSTER$KUBE_NAMESPACE"

    if [ "$CMD" = "apply" ]; then
        COMMAND="kubectl apply $KUBE_OPTIONS-f -"
    elif [ "$CMD" = "show" ]; then
        COMMAND="cat"
        NEEDS_CONFIRM="no"
    else
        help
    fi
}

confirm() {
    if [ "$NEEDS_CONFIRM" = "yes" ]; then
        echo -n "### ARE YOU SURE $1? \[ENTER or CTRL-C\] : "
        read tmp
    else
        echo "###"
    fi
}

parse_args "$@"

echo "### STEP0) OPTIONS"
echo "#   KUBE_CONFIG    = $KUBE_CONFIG"
echo "#   KUBE_CONTEXT   = $KUBE_CONTEXT"
echo "#   KUBE_CLUSTER   = $KUBE_CLUSTER"
echo "#   KUBE_NAMESPACE = $KUBE_NAMESPACE"
echo "#"
echo "#   COMMAND        = $COMMAND"
echo "#   DRYRUN         = $DRYRUN"
confirm "to use these options"
echo "---"

echo
`;

        yield ''
        yield ''

        const steps = this.buildSteps(objects);
        for (let no = 0; no < steps.length; ++no) {
            const step = steps[no];
            yield `########################################`
            yield `## STEP: ${step.name}`
            yield `########################################`
            yield ''

            if (step.objects.length == 0) {
                yield `# nothing to apply in this step`;
                continue;
            }

            yield `echo`
            yield `echo "### STEP ${no + 1}) ${step.name}"`

            yield `if [ "$CMD" != "show" ]; then`
            yield `   echo "#   $COMMAND <<'EOF' {${step.objects.length} objects} EOF"`
            yield `   confirm "to apply ${step.name} step"`
            //console.log(`else`);
            //console.log(`   echo "###"`);
            yield `fi`
            yield `echo`
            yield ''
            yield `echo "---"`
            yield ''

            yield `$COMMAND <<'EOF'`
            const yaml = step.objects.map(o => jsyaml.dump(o)).join('---\n');
            yield yaml + 'EOF'
            yield 'echo "---"'

            yield ''
        }
    }

}
