"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const js_yaml_1 = __importDefault(require("js-yaml"));
class BashOutput {
    constructor(options) {
        this.options = options;
    }
    buildSteps(objects) {
        const g = [
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
    writeStringOption(varName, optionName, optionValue) {
        const option = optionValue
            ? `--${optionName} ${optionValue} `
            : '';
        console.log(`${varName}="${option}" `);
    }
    writeBooleanOption(varName, optionName, optionValue) {
        const option = optionValue
            ? `--${optionName}`
            : '';
        console.log(`${varName}="${option}" `);
    }
    write(objects) {
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
        console.log('');
        console.log();
        const steps = this.buildSteps(objects);
        steps.forEach((step, no) => {
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
            console.log(`   confirm "to apply ${step.name} step"`);
            //console.log(`else`);
            //console.log(`   echo "###"`);
            console.log(`fi`);
            console.log(`echo`);
            console.log();
            console.log(`echo "---"`);
            console.log();
            console.log(`$COMMAND <<'EOF'`);
            const yaml = step.objects.map(o => js_yaml_1.default.dump(o)).join('---\n');
            console.log(yaml + 'EOF');
            console.log('echo "---"');
            console.log();
        });
        steps.forEach((step, no) => {
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
            console.log(`   confirm "to apply ${step.name} step"`);
            //console.log(`else`);
            //console.log(`   echo "###"`);
            console.log(`fi`);
            console.log(`echo`);
            console.log(`echo "---"`);
            console.log(`$COMMAND <<'EOF'`);
            const yaml = step.objects.map(o => js_yaml_1.default.dump(o)).join('---\n');
            console.log(yaml + 'EOF');
            console.log('echo "---"');
            console.log();
        });
    }
}
exports.BashOutput = BashOutput;
