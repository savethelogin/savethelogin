const webpack = require('webpack');
const ejs = require('ejs');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MergeJsonWebpackPlugin = require('merge-jsons-webpack-plugin');
const ExtensionReloader = require('webpack-extension-reloader');
const { VueLoaderPlugin } = require('vue-loader');
const { version } = require('./package.json');

const config = {
  mode: process.env.NODE_ENV,
  context: __dirname + '/src',
  entry: {
    popup: './popup.js',
    background: './background.js',
  },
  output: {
    path: __dirname + '/dist',
    filename: '[name].js',
  },
  optimization: {
    minimize: true,
  },
  performance: {
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
  resolve: {
    extensions: ['.js', '.vue'],
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loaders: ['vue-loader'],
      },
      {
        test: /\.js$/,
        exclude: /node_modules|_test\.js$/,
        use: Array.prototype.slice.apply(
          [
            {
              loader: 'babel-loader',
            },
            {
              loader: 'istanbul-instrumenter-loader',
              options: {
                esModules: true,
              },
            },
          ],
          process.env.NODE_ENV !== 'development' ? [0, -1] : [0]
        ),
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.scss$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
      },
      {
        test: /\.sass$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader?indentedSyntax'],
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|ico)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]',
          outputPath: '/images/',
          emitFile: false,
        },
      },
      {
        test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]',
          outputPath: '/fonts/',
          emitFile: false,
        },
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      global: 'window',
    }),
    new VueLoaderPlugin(),
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
    new CopyWebpackPlugin([
      { from: 'icons', to: 'icons', ignore: ['icon.xcf'] },
      { from: '_locales', to: '_locales' },
      { from: 'popup.html', to: 'popup.html', transform: transformHtml },
      {
        from: 'manifest.json',
        to: 'manifest.json',
        transform: transformJson,
      },
      {
        from: 'modules/**/public/*.{html,js,css}',
        to: '[name].[ext]',
      },
    ]),
    new MergeJsonWebpackPlugin({
      debug: true,
      space: 2,
      output: {
        groupBy: [
          {
            pattern: '{./modules/**/_locales/en/messages.json,./_locales/en/messages.json}',
            fileName: './_locales/en/messages.json',
          },
        ],
      },
    }),
  ],
};

if (!process.argv.includes('--watch')) {
  config.plugins = (config.plugins || []).concat([new CleanWebpackPlugin()]);
}

if (config.mode === 'production') {
  if (!config.optimization) config.optimization = {};
  config.optimization.minimizer = (config.optimization.minimizer || []).concat([
    new TerserPlugin({
      terserOptions: {
        compress: {
          drop_console: true,
        },
      },
    }),
  ]);
  config.plugins = (config.plugins || []).concat([
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"',
      },
    }),
  ]);
}

if (process.env.HMR === 'true') {
  config.plugins = (config.plugins || []).concat([
    new ExtensionReloader({
      manifest: __dirname + '/src/manifest.json',
    }),
  ]);
}

function transformHtml(content) {
  return ejs.render(content.toString(), {
    ...process.env,
  });
}

function transformJson(content) {
  const jsonContent = JSON.parse(content);
  jsonContent.version = version;

  if (process.env.NODE_ENV === 'development') {
    jsonContent.content_security_policy =
      "script-src https://unpkg.com 'self' 'unsafe-eval'; object-src 'self'";
  }

  return JSON.stringify(jsonContent, null, 2);
}

module.exports = config;
