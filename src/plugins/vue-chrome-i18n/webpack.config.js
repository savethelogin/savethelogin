/** @copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> */
var path = require('path');
var webpack = require('webpack');
const { VueLoaderPlugin } = require('vue-loader');

module.exports = {
  mode: process.env.NODE_ENV,
  context: path.join(__dirname, 'src'),
  entry: './index.js',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'vue-chrome-i18n.js',
    library: 'VueChromeI18n',
    libraryTarget: 'umd',
  },
  resolve: {
    extensions: ['.js', '.vue'],
  },
  optimization: {
    minimize: true,
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: ['vue-loader'],
      },
      {
        test: /\.js$/,
        loader: ['babel-loader'],
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [new VueLoaderPlugin()],
};
