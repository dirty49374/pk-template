const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
    entry: {
        pkt: './src/pkt/index.ts',
        pkctl: './src/pkctl/index.ts',
        ['pk-lib']: './src/pk-lib/index.ts',
    },
    devtool: 'inline-source-map',
    target: 'node',
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: [/node_modules/]
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist')
    },
    externals: [nodeExternals()],
};
