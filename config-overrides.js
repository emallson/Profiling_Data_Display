const { override, useBabelRc, addWebpackModuleRule, addWebpackPlugin } = require('customize-cra');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const addLinariaSupport = addWebpackModuleRule({
  test: /\.[jt]sx?$/,
  use: [
    { loader: 'babel-loader' },
    {
      loader: '@linaria/webpack-loader',
      options: {
        sourceMap: true,
      }
    }
  ]
});

const addCssExtraction = [
  addWebpackModuleRule({
    test: /\.css$/,
    use: [
      { loader: MiniCssExtractPlugin.loader },
      {
        loader: 'css-loader',
        options: {
          sourceMap: true,
        }
      }
    ]
  }),
  addWebpackPlugin(new MiniCssExtractPlugin({
    filename: 'styles.[contenthash].css'
  })),
];

module.exports = override(
  useBabelRc(),
  addLinariaSupport,
  ...addCssExtraction,
)
