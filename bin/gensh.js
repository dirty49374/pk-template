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

module.exports = gensh
