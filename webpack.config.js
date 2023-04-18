const path = require('path');

module.exports = {
  mode: 'production',
  devtool: false,
  entry: {
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
            loader: require('webpack-obfuscator').loader,
            options: {
              config: path.resolve(__dirname, 'obfuscator.config.json'),
            },
          },
          {
            loader: 'babel-loader',
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js', '.json'],
  },
};
