const webpack = require('webpack');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const HtmlReplaceWebpackPlugin = require('html-replace-webpack-plugin');
const RollbarSourceMapPlugin = require('rollbar-sourcemap-webpack-plugin');
const RollbarDeployPlugin = require('rollbar-deploy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const path = require('path');
const { execSync } = require('child_process');
const { version } = require('./package.json');
const { rollbar } = require('./src/server/config');

const { rollbarClientToken, rollbarServerToken } = rollbar;
const publicPath = '/';

const SOURCE_VERSION = process.env.SOURCE_VERSION || execSync('git rev-parse --short HEAD').toString();
const USER = execSync('whoami').toString();
console.log('SOURCE_VERSION', SOURCE_VERSION);
console.log('USER', USER);
console.log('version', version);

module.exports = (env, argv) => {
  const isDev = argv.mode !== 'production';
  const config = {
    entry: path.join(__dirname, 'src', 'client', 'index.js'),
    output: {
      path: path.join(__dirname, 'dist'),
      publicPath,
      filename: '[hash].js',
      chunkFilename: '[chunkhash].js',
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          include: [
            path.resolve(__dirname, 'src', 'client'),
          ],
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                [
                  '@babel/preset-env', { targets: { ie: '11' } },
                ],
              ],
            },
          },
        },
        {
          test: /\.html$/,
          include: path.resolve(__dirname, 'src', 'client'),
          use: [
            {
              loader: 'html-loader',
              options: { minimize: !isDev },
            },
          ],
        },
        {
          test: /\.(png|woff|woff2|eot|ttf|svg)$/,
          include: [
            path.resolve(__dirname, 'src', 'client', 'assets'),
            path.resolve(__dirname, 'node_modules', 'bootstrap'),
          ],
          loader: 'url-loader?limit=100000',
        },
        {
          test: /\.scss$/,
          include: [
            path.resolve(__dirname, 'src', 'client'),
          ],
          use: [
            'style-loader',
            MiniCssExtractPlugin.loader,
            'css-loader',
            'sass-loader',
          ],
        },
        {
          test: /\.css$/,
          include: [
            path.resolve(__dirname, 'src', 'client'),
            path.resolve(__dirname, 'node_modules', 'bootstrap'),
            path.resolve(__dirname, 'node_modules', 'bootstrap-social'),
            path.resolve(__dirname, 'node_modules', 'clusterize.js'),
            // path.resolve(__dirname, 'node_modules', 'c3'),
            // path.resolve(__dirname, 'node_modules', 'datatables.net-bs'),
          ],
          use: [MiniCssExtractPlugin.loader, 'css-loader'],
        },
      ],
    },
    devServer: {
      contentBase: path.join(__dirname, 'dist'),
      compress: true,
      historyApiFallback: { index: '/index.html' },
      proxy: {
        '/api': {
          target: 'http://localhost:8228',
          changeOrigin: true,
        },
        '/auth': {
          target: 'http://localhost:8228',
          changeOrigin: true,
        },
      },
    },
    plugins: [
      new CleanWebpackPlugin(),
      new HtmlWebPackPlugin({
        template: './src/client/index.html',
        filename: './index.html',
      }),
      !isDev && new HtmlReplaceWebpackPlugin([
        {
          pattern: '@@ROLLBAR_TOKEN',
          replacement: rollbarClientToken,
        },
        {
          pattern: '@@VERSION',
          replacement: version,
        },
      ]),
      !isDev && new RollbarSourceMapPlugin({
        accessToken: rollbarServerToken,
        version,
        publicPath: '//getset.herokuapp.com',
      }),
      !isDev && new RollbarDeployPlugin({
        accessToken: rollbarServerToken,
        environment: 'production',
        revision: SOURCE_VERSION,
        localUsername: USER,
      }),
      new MiniCssExtractPlugin({
        filename: '[name].[hash].css',
        chunkFilename: '[id].[chunkhash].css',
      }),
      new CopyWebpackPlugin([
        { from: './src/client/assets' },
      ]),
      new webpack.ProvidePlugin({
        $: 'jquery',
        jQuery: 'jquery',
      }),
    ].filter(Boolean),
    devtool: isDev ? 'eval-source-map' : 'hidden-source-map',
  };
  return config;
};
