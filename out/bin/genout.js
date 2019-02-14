"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const json_output_1 = require("./outputs/json-output");
const pkt_output_1 = require("./outputs/pkt-output");
const yaml_output_1 = require("./outputs/yaml-output");
const bash_output_1 = require("./outputs/bash-output");
function outputFactory(options) {
    if (options.json || options.json1) {
        return new json_output_1.JsonOutput(options);
    }
    else if (options.pkt) {
        return new pkt_output_1.PktOutput(options);
    }
    else if (options.apply) {
        return new bash_output_1.BashOutput(options);
    }
    else {
        return new yaml_output_1.YamlOutput(options);
    }
}
exports.outputFactory = outputFactory;
