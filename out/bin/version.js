"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const lib_1 = require("../lib");
function version() {
    const pkg = lib_1.loaders.yaml(null, path_1.default.join(__dirname, '../package.json'));
    console.log(pkg.version);
}
exports.default = version;
