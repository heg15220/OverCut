const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { HotModuleReplacementPlugin } = require('webpack');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      publicPath: isProduction ? '/f1hub/' : '/',  // ✅ cambia aquí
      filename: 'bundle.js',
      clean: true
    },
    resolve: {
      extensions: ['.js', '.jsx'],
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-react']
            }
          }
        },
        {
          test: /\.(png|jpe?g|gif|svg)$/i,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: '[path][name].[ext]',
                outputPath: 'images/',
                publicPath: 'images/',
              },
            },
          ],
        },
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
            'postcss-loader',
          ],
        }
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './public/index.html',
      }),
      isProduction && new MiniCssExtractPlugin({
        filename: '[name].[contenthash].css',
      }),
      !isProduction && new HotModuleReplacementPlugin(),
    ].filter(Boolean),
    devServer: {
      static: path.join(__dirname, 'dist'),
      compress: true,
      port: 8083,
      hot: !isProduction,
      historyApiFallback: true,
      open: true, // ← 🔥 ESTO hace que abra el navegador automáticamente
      allowedHosts: 'all',
    },
    mode: isProduction ? 'production' : 'development',
  };
};
