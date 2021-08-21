const path = require('path');

module.exports = {
    mode: 'development',
    devtool: false,
    entry: {
        index: './src/typescript/index.ts',
        injector: './src/typescript/injector.ts',
        download: './src/typescript/download.ts'
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'build'),
    },
    module: {
        rules:
        [
            {
                test: /\.ts$/,
                use:
                [
                    {
                        loader: 'ts-loader',
                        options:
                        {
                            configFile: './tsconfig.json'
                        }
                    }
                ],
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: [".ts"]
    }
};