"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const loaders = require('./loaders');
const evaluators = require('./evaluators');
const runtimes = require('./runtimes');
const configs_1 = __importDefault(require("./configs"));
exports.default = { runtimes, configs: configs_1.default, loaders, evaluators, run: runtimes.run };
