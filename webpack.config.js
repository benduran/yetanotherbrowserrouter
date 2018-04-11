
const path = require('path');

function webpackConfig(env = {}) {
  const { production } = env;
  const config = {
    mode: production ? 'production' : 'development',
    entry: path.join(__dirname, 'index.js'),
    output: {
      library: 'yabr',
      libraryTarget: 'umd',
      umdNamedDefine: true,
      path: path.join(__dirname, 'dist'),
      filename: 'yabr.js',
    },
    module: {
      rules: [{
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: [{
          loader: 'babel-loader',
          options: {
            presets: [['env', { targets: { browsers: ['last 2 versions'] } }]],
          },
        }],
      }],
    },
    resolve: {
      extensions: ['.js'],
    },
    optimization: {
      nodeEnv: production ? 'production' : 'development',
      minimize: production,
    },
  };
  return config;
}

module.exports = webpackConfig;
