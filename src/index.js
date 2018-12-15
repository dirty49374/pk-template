const loaders = require('./loaders');
const evaluators = require('./evaluators');
const runtimes = require('./runtimes');
const configs = require('./configs');

module.exports = { runtimes, configs, loaders, evaluators, run: runtimes.run };
