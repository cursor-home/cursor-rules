//@ts-check

'use strict';

const path = require('path');

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

/**
 * @param {any} env
 * @returns {WebpackConfig[]}
 */
module.exports = (env = {}) => {
  /** @type WebpackConfig */
  const extensionConfig = {
    target: 'node', // VS Code extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/
    mode: 'none', // this leaves the source code as close as possible to the original (when packaging we set this to 'production')

    entry: './src/extension.ts', // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
    output: {
      // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
      path: path.resolve(__dirname, 'dist'),
      filename: 'extension.js',
      libraryTarget: 'commonjs2'
    },
    externals: {
      vscode: 'commonjs vscode' // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
      // modules added here also need to be added in the .vscodeignore file
    },
    resolve: {
      // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
      extensions: ['.ts', '.js', '.tsx', '.jsx']
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'ts-loader'
            }
          ]
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        }
      ]
    },
    devtool: 'nosources-source-map',
    infrastructureLogging: {
      level: "log", // enables logging required for problem matchers
    },
  };

  /** @type WebpackConfig */
  const webviewConfig = {
    target: 'web',
    mode: 'none',

    entry: './src/webview/index.tsx',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'webview.js'
    },
    resolve: {
      extensions: ['.ts', '.js', '.tsx', '.jsx'],
      fallback: {
        // Webpack 5需要显式提供Node.js核心模块的polyfills
        "path": require.resolve("path-browserify"),
        "fs": false,
        "process": require.resolve("process/browser"),
        // 添加vscode模块的映射，指向我们的模拟模块
        "vscode": path.resolve(__dirname, "src/webview/mocks/vscode.ts")
      }
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                // 跳过类型检查，因为WebView部分可能引用了Node.js模块
                transpileOnly: true
              }
            }
          ]
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        }
      ]
    },
    plugins: [
      // 提供process变量作为polyfill
      new (require('webpack')).ProvidePlugin({
        process: 'process/browser'
      })
    ],
    devtool: 'nosources-source-map',
    // 防止webpack警告devtool兼容性问题
    performance: {
      hints: false
    }
  };

  return [ extensionConfig, webviewConfig ];
};