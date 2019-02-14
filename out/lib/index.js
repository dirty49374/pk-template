"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const loaders = __importStar(require("./loaders"));
exports.loaders = loaders;
const evaluators = __importStar(require("./evaluators"));
exports.evaluators = evaluators;
const configs = __importStar(require("./configs"));
exports.configs = configs;
const runtimes = __importStar(require("./runtimes"));
exports.runtimes = runtimes;
// export { default as evaluators } from './evaluators';
// export { default as configs } from './configs';
// export { default as runtimes } from './runtimes';
// export { run: runtimes.run };
// console.log(loaders)
// export default { runtimes, configs, loaders, evaluators, run: runtimes.run };
