"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const js_yaml_1 = __importDefault(require("js-yaml"));
class PktOutput {
    constructor(options) {
        this.options = options;
    }
    write(objects) {
        var pkt = {
            routine: objects.map(o => ({ add: o }))
        };
        const yaml = js_yaml_1.default.dump(pkt);
        console.log(yaml);
    }
}
exports.PktOutput = PktOutput;
