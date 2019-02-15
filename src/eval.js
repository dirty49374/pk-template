module.exports = ($, script, values) => {
    with (values) {
        return eval(script);
    }
};
