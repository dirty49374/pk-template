const _ = require('underscore');
const fs = require("fs");
const jsonpatch = require("json-patch");
const jsonpath = require("jsonpath");
const url = require('url');
const path = require('path');
const jsyaml = require('js-yaml');
const syncRequest = require('sync-request');
const coffeeScript = require('coffeescript');
const liveScript = require('livescript');
const base = require('./base');
const loaders = require('./loaders');
const evaluators = require('./evaluators');
const runtimes = require('./runtimes');
const configs = require('./configs');

const utils = {
    buildAssign(scope, assign) {
        if (!assign) return {};

        return evaluators.deep(scope, assign);
    },
};

module.exports = { runtimes, configs, loaders, utils, evaluators, run: runtimes.run };
