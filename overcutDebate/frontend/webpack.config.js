// frontend/webpack.config.js
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const Dotenv = require("dotenv-webpack");

module.exports = (env, argv) => {
  const isProd = argv.mode === "production";

  return {
    entry: path.resolve(__dirname, "src", "index.js"),
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: isProd ? "static/js/[name].[contenthash].js" : "static/js/bundle.js",
      publicPath: "/", // importante con HashRouter, y para refresh.
      clean: true
    },

    devtool: isProd ? "source-map" : "eval-source-map",

    resolve: {
      extensions: [".js", ".jsx"]
    },

    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env", "@babel/preset-react"]
            }
          }
        },
        {
          test: /\.css$/i,
          use: ["style-loader", "css-loader"]
        },
        {
          test: /\.(png|jpg|jpeg|gif|svg|webp)$/i,
          type: "asset/resource",
          generator: {
            filename: "static/media/[name].[hash][ext][query]"
          }
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: "asset/resource",
          generator: {
            filename: "static/fonts/[name].[hash][ext][query]"
          }
        }
      ]
    },

    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, "public", "index.html"),
        inject: "body"
      }),
      new Dotenv()
    ],

    devServer: {
      port: 3001,
      historyApiFallback: true,
      hot: true,
      static: {
        directory: path.resolve(__dirname, "public")
      },

      // ✅ Proxy para tu appFetch con BASE_PATH="/overcut/api"
      proxy: [
        {
          context: ["/overcutdebate/api"],
          target: "http://localhost:8084",
          changeOrigin: true,
          secure: false
        }
      ]
    }
  };
};
