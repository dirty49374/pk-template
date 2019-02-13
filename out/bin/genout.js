"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const js_yaml_1 = __importDefault(require("js-yaml"));
const gensh = (yaml, userdata) => {
    const lines = [];
    lines.push("#!/bin/sh");
    lines.push("");
    lines.push(`echo "now deploying objects using '${userdata.kubeconfig}' kubeconfig"`);
    lines.push("");
    if (userdata.kubeconfig) {
        lines.push(`cat | kubectl --kubeconfig ${userdata.kubeconfig} apply -f - <<EOF`);
    }
    else {
        lines.push(`cat | kubectl apply -f - <<EOF`);
    }
    lines.push("# ------- YAML BEGIN -------");
    lines.push(yaml);
    lines.push("# ------- YAML ENDS -------");
    lines.push("EOF");
    lines.push("");
    return lines.join("\n");
};
const genout = (yaml, options) => {
    if (options.shellscript)
        return gensh(yaml, {});
    if (options.json) {
        if (options.indent) {
            return JSON.stringify(js_yaml_1.default.loadAll(yaml), null, 4);
        }
        else {
            return JSON.stringify(js_yaml_1.default.loadAll(yaml));
        }
    }
    else if (options.json1) {
        if (options.indent) {
            return JSON.stringify(js_yaml_1.default.loadAll(yaml)[0], null, 4);
        }
        else {
            return JSON.stringify(js_yaml_1.default.loadAll(yaml)[0]);
        }
    }
    else if (options.pkt) {
        const objs = js_yaml_1.default.loadAll(yaml);
        var pkt = {
            routine: objs.map(o => ({ add: o }))
        };
        return js_yaml_1.default.dump(pkt);
    }
    else {
        return yaml;
    }
};
exports.default = genout;
