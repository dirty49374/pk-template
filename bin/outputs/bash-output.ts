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
    writeStringOption(varName: string, optionName: string, optionValue: string | undefined): any {
        const option = optionValue
            ? `--${optionName} ${optionValue} `
            : '';
        console.log(`${varName}="${option}" `);
    }
    writeBooleanOption(varName: string, optionName: string, optionValue: boolean): any {
        const option = optionValue
            ? `--${optionName}`
            : '';
        console.log(`${varName}="${option}" `);
    }    
    write(objects: IObject[]) {

        console.log(`#!/bin/sh`);
        console.log();

        this.writeStringOption('KUBE_CONFIG', 'kubeconfig', this.options.kubeconfig);
        this.writeStringOption('KUBE_CONTEXT', 'context', this.options.kubecontext);
        this.writeStringOption('KUBE_CLUSTER', 'cluster', this.options.kubecluster);
        this.writeStringOption('KUBE_NAMESPACE', 'namespace', this.options.kubenamespace);

        console.log(`
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
`);

        console.log('')
        console.log();

        const steps = this.buildSteps(objects);
        steps.forEach((step: ApplyStep, no: number) => {
            console.log(`########################################`);
            console.log(`## STEP: ${step.name}`);
            console.log(`########################################`);
            console.log();

            if (step.objects.length == 0) {
                console.log(`# nothing to apply in this step`);
                return;
            }

            console.log(`echo`);
            console.log(`echo "### STEP ${no + 1}) ${step.name}"`);

            console.log(`if [ "$CMD" != "show" ]; then`);
            console.log(`   echo "#   $COMMAND <<'EOF' {${step.objects.length} objects} EOF"`);
            console.log(`   confirm "to apply ${step.name} step"`)
            //console.log(`else`);
            //console.log(`   echo "###"`);
            console.log(`fi`);
            console.log(`echo`);
            console.log();
            console.log(`echo "---"`);
            console.log();

            console.log(`$COMMAND <<'EOF'`);
            const yaml = step.objects.map(o => jsyaml.dump(o)).join('---\n');
            console.log(yaml + 'EOF');
            console.log('echo "---"');

            console.log();
        });
        steps.forEach((step: ApplyStep, no: number) => {
            console.log(`########################################`);
            console.log(`## STEP: ${step.name}`);
            console.log(`########################################`);
            console.log();

            if (step.objects.length == 0) {
                console.log(`# nothing to apply in this step`);
                return;
            }

            console.log(`echo "\n### STEP ${no + 1}) ${step.name}"`);

            console.log(`if [ "$CMD" != "show" ]; then`);
            console.log(`   echo "#   $COMMAND <<'EOF' {${step.objects.length} objects} EOF"`);
            console.log(`   confirm "to apply ${step.name} step"`)
            //console.log(`else`);
            //console.log(`   echo "###"`);
            console.log(`fi`);
            console.log(`echo`);
            console.log(`echo "---"`);

            console.log(`$COMMAND <<'EOF'`);
            const yaml = step.objects.map(o => jsyaml.dump(o)).join('---\n');
            console.log(yaml + 'EOF');
            console.log('echo "---"');

            console.log();
        });
    }

}
