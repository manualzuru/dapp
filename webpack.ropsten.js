const merge = require("webpack-merge");
const common = require("./webpack.common.js");

module.exports = merge(common, {
    mode: "development",
    devtool: "inline-source-map",
    devServer: {
        historyApiFallback: true,
        hot: true,
        host: "localhost",
        port: 3000
    },
    externals: {
        config: JSON.stringify({
            networkId: 3,
            marketAddress: "0x08a7c6d9ec99aefb45313994154c31604b8161ed",
            testnetDAIAddress: "0x2d69ad895797c880abce92437788047ba0eb7ff6"
        })
    }
});
