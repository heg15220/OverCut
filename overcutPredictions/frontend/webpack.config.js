const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const webpack = require("webpack");

module.exports = (env, argv) => {
  const isProduction = argv.mode === "production";

  return {
    entry: "./src/index.js",

    output: {
      path: path.resolve(__dirname, "dist"),
      publicPath: isProduction ? "/overcutPredictions/" : "/",
      filename: "bundle.js",
      clean: true,
    },

    resolve: {
      extensions: [".js", ".jsx"],

      // ✅ IMPORTANTÍSIMO para ESM (.mjs) "fully specified"
      alias: {
        "process/browser": require.resolve("process/browser.js"),
      },

      // ✅ Polyfill de `process` para browser
      fallback: {
        process: require.resolve("process/browser.js"),
      },
    },

    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-react"],
            },
          },
        },
        {
          test: /\.(png|jpe?g|gif|svg)$/i,
          use: [
            {
              loader: "file-loader",
              options: {
                name: "[path][name].[ext]",
                outputPath: "images/",
                publicPath: "images/",
              },
            },
          ],
        },
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : "style-loader",
            "css-loader",
            "postcss-loader",
          ],
        },
      ],
    },

    plugins: [
      new HtmlWebpackPlugin({
        template: "./public/index.html",
      }),

      // ✅ Define env vars en build-time (no runtime)
      new webpack.DefinePlugin({
        "process.env.NODE_ENV": JSON.stringify(isProduction ? "production" : "development"),
        "process.env.REACT_APP_OVERCUT_URL": JSON.stringify(process.env.REACT_APP_OVERCUT_URL || ""),
      }),

      // ✅ Proveer `process` global si alguna lib lo toca
      new webpack.ProvidePlugin({
        process: "process/browser.js",
      }),

      isProduction &&
        new MiniCssExtractPlugin({
          filename: "[name].[contenthash].css",
        }),
    ].filter(Boolean),

    devServer: {
      static: path.join(__dirname, "dist"),
      compress: true,
      port: 8086,
      hot: !isProduction,
      historyApiFallback: true,
      open: true,
      allowedHosts: "all",
    },

    mode: isProduction ? "production" : "development",
  };
};
