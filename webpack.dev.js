const config = require("./webpack.config");
const path = require('path');

const dist = path.resolve(__dirname, 'dist');

module.exports = Object.assign({}, config, {
    mode: "development",
    devtool: "inline-source-map",
    devServer: {
        contentBase: dist,
        compress: true,
        port: 9000,
        stats: {
            chunks: false,
            modules: false,
        },
    }
});