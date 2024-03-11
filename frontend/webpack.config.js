const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
    const isProduction = argv.mode === 'production';

    return {
        entry: './src/index.js', // Punto de entrada de tu aplicación
        output: {
            path: path.resolve(__dirname, 'dist'), // Directorio de salida
            filename: 'bundle.js', // Nombre del archivo de salida
        },
        resolve: {
            extensions: ['.js', '.jsx'], // Extensiones de archivo que Webpack resolverá
        },
        module: {
            rules: [
                {
                    test: /\.(js|jsx)$/, // Expresión regular para archivos JS y JSX
                    exclude: /node_modules/, // Excluye la carpeta node_modules
                    use: {
                        loader: 'babel-loader', // Usa babel-loader para transpilar JSX
                        options: {
                            presets: ['@babel/preset-react'], // Preset para transpilar JSX
                        },
                    },
                },
                {
                    test: /\.css$/, // Expresión regular para archivos CSS
                    use: ['style-loader', 'css-loader'], // Usa style-loader y css-loader para manejar archivos CSS
                },
                {
                    test: /\.svg$/,
                    use: ['@svgr/webpack'],
                },
            ],
        },
        plugins: [
            new HtmlWebpackPlugin({
                template: './public/index.html', // Plantilla HTML
            }),
        ],
        devServer: {
            contentBase: path.join(__dirname, 'dist'), // Directorio base del servidor de desarrollo
            compress: true, // Habilita la compresión
            port: 3000, // Puerto del servidor de desarrollo
        },
        mode: isProduction ? 'production' : 'development', // Modo de Webpack basado en el argumento de línea de comandos
    };
};
