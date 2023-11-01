/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TersePlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
  return {
    stats: 'minimal',
    entry: './src/index.ts',

    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'bundle.js',
    },

    devServer: {
      compress: true,
      allowedHosts: ['127.0.0.1'],
      static: false,
      client: {
        logging: 'warn',
        overlay: {
          errors: true,
          warnings: false,
        },
        progress: true,
      },
      port: 1234,
      host: '127.0.0.1',
    },

    performance: { hints: false },

    devtool: argv.mode === 'development' ? 'inline-source-map' : false,

    // Minify for final build.
    optimization: {
      minimize: argv.mode === 'production',
      minimizer: [
        new TersePlugin({
          terserOptions: {
            ecma: 6,
            compress: { drop_console: true },
            output: { comments: false, beautify: false },
          },
        }),
      ],
    },

    module: {
      rules: [
        {
          test: /\.ts(x)?$/,
          loader: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.js$/,
          loader: 'babel-loader',
          exclude: /node_modules/,
        },
      ],
    },

    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
    },

    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          { from: 'public/' }
        ],
      }),

      new HtmlWebpackPlugin({
        template: './index.html',
        hash: true,
        minify: false,
      })
    ]
  };
};
