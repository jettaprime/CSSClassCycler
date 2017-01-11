import path from 'path';
import webpack from 'webpack';

export default {
  entry: {
    index: ['./lib/index.js'],
    bootstrap: './lib/bootstrap.js'
  },
  output: {
    path: './dist',
    filename: './[name].js'
  },
  resolve: {
    root: [
      path.resolve('.'),
      path.resolve('./lib')
    ]
  },
  module: {
    loaders: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel-loader'
    }]
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      compress: true,
      mangle: true,
      output: {
        comments: false,
        semicolons: true
      }
    }),
    new webpack.optimize.DedupePlugin()
  ]
};
