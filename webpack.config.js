
const path = require('path');
const { optimize } = require('webpack');

function webpack(env = {}) {
  const { production } = env;
  const plugins = [];
  if (production) plugins.push(new optimize.UglifyJsPlugin({ mangle: true, comments: false, compress: true }));
  const config = {
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
            presets: [['env', {
              targets: {
                browsers: ['last 2 versions'],
              }
            }]],
          },
        }],
      }],
    },
    resolve: {
      extensions: ['.js'],
    },
    plugins,
  };
  return config;
}

module.exports = webpack;
