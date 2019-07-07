const path = require('path');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

const dist = path.resolve(__dirname, 'dist');

module.exports = {
    entry: {
        app: './src/view/index.ts',
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.css$/,
                use: [ 'style-loader', 'css-loader' ]
            },
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    output: {
        filename: 'bundle.js',
        path: dist,
    },
    plugins: [
        new MonacoWebpackPlugin()
    ],
};
