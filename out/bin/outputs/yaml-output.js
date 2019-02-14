"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const js_yaml_1 = __importDefault(require("js-yaml"));
class YamlOutput {
    constructor(options) {
        this.options = options;
    }
    write(objects) {
        console.log(`# KUBE_CONFIG=${this.options.kubeconfig || ""}`);
        console.log(`# KUBE_CONTEXT=${this.options.kubecontext || ""}`);
        console.log(`# KUBE_CLUSTER=${this.options.kubecluster || ""}`);
        console.log(`# KUBE_NAMESPACE=${this.options.kubenamespace || ""}`);
        console.log(`---`);
        objects.forEach((o) => {
            console.log(js_yaml_1.default.dump(o));
            console.log('---');
        });
    }
}
exports.YamlOutput = YamlOutput;
