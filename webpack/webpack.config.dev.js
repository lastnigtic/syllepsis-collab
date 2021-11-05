const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: path.resolve(__dirname, '../client/index.tsx'),
  mode: 'development',
  devtool: 'source-map',
  resolve: {
    extensions: ['.js', '.json', '.ts', '.tsx'],
  },
  devServer: {
    host: '0.0.0.0',
    port: 4000,
    proxy: {
      '/collab-backend': {
        target: 'http://127.0.0.1:8000',
        pathRewrite: { '^/collab-backend': '' },
        changeOrigin: true,
      },
    },
  },
  module: {
    rules: [
      {
        test: /\.[j|t]sx?$/,
        use: 'babel-loader',
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: 'bundle.js',
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, '../index.html'),
    }),
  ],
};
