const path = require('path');

module.exports = {
  mode: 'development',
  devtool: false,
  entry: {
    serviceWorker_index: './src/typescript/serviceWorker_index.ts',
    vkAudio_index: './src/typescript/vkAudio_index.ts',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'build'),
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: './tsconfig.json',
            },
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts'],
  },
};
