const { Context } = require('./context');
const { Processor } = require('./processor');

module.exports = {
    Context,
    Processor,
    expand: (objects, values, files, { verbose, preset }) => {
        const context = new Context(objects, values, '.', preset || null);

        const processor = new Processor();
        processor.setLogging(!!verbose);
        processor.expandFiles(context, files);

        return context.dumpObjects();
    }
};
