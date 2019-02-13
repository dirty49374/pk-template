const loaders = require('./loaders');
const evaluators = require('./evaluators');
const runtimes = require('./runtimes');
import configs from './configs';

export default { runtimes, configs, loaders, evaluators, run: runtimes.run };
