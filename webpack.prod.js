const config = require("./webpack.config");
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

module.exports = Object.assign({}, config, {
    mode: "production",
    plugins: [
        new MonacoWebpackPlugin({
            languages: ["javascript"],
        })
    ],
});