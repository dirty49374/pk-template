const jsyaml = require('js-yaml');

const gensh = (yaml, userdata) => {
    const lines = []
    lines.push("#!/bin/sh")
    lines.push("")
    lines.push(`echo "now deploying objects using '${userdata.kubeconfig}' kubeconfig"`)
    lines.push("")
    if (userdata.kubeconfig) {
        lines.push(`cat | kubectl --kubeconfig ${userdata.kubeconfig} apply -f - <<EOF`)
    } else {
        lines.push(`cat | kubectl apply -f - <<EOF`)
    }
    lines.push("# ------- YAML BEGIN -------")
    lines.push(yaml);
    lines.push("# ------- YAML ENDS -------")
    lines.push("EOF")
    lines.push("")

    return lines.join("\n")
}

const genout = (yaml, options) => {
    if (options.shellscript)
        return gensh(yaml, userdata);

    if (options.json) {
        if (options.indent) {
            return JSON.stringify(jsyaml.loadAll(yaml), null, 4);
        } else {
            return JSON.stringify(jsyaml.loadAll(yaml));
        }
    } else if (options.json1) {
        if (options.indent) {
            return JSON.stringify(jsyaml.loadAll(yaml)[0], null, 4);
        } else {
            return JSON.stringify(jsyaml.loadAll(yaml)[0]);
        }                
    } else if (options.pkt) {
        const objs = jsyaml.loadAll(yaml);
        var pkt = {
            routine: objs.map(o => ({ add: o }))
        }
        return jsyaml.dump(pkt);
    } else {
        return yaml;
    }
}

module.exports =  genout;
