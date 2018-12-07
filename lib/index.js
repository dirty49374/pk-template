const { Context } = require('./context');
const { Processor } = require('./processor');

module.exports = {
    Context,
    Processor,
    expand: (objects, values, files, { verbose }) => {
        const processor = new Processor();
        processor.setLogging(!!verbose);

        const context = new Context(objects, values, '.');
        processor.expandFiles(context, files);

        return context.dumpObjects();
    }
};
