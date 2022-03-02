/*
 * Copyright (c) 2022. ICRL
 * See the file LICENSE.md for copying permission.
 */

const path = require("path");
const {merge} = require("webpack-merge");
const base = require("./webpack.base.config");

module.exports = env => {
    return merge(base(env), {
        entry: {
            main: "./src/main.js",
            app: "./src/app.js",
            setting: "./src/setting.js",
        },
        output: {
            filename: "[name].js",
            path: path.resolve(__dirname, "../app")
        }
    });
};
