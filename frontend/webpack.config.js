module.exports = {
    mode: 'development',    // otras configuraciones...
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ['@babel/preset-react'],
                    },
                },
            },

            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
            // otras reglas...
        ],
    },
    // más configuraciones...
};
