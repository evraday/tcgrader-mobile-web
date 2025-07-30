const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Debug: Log loaded env vars (without exposing values)
console.log('Environment variables loaded:');
console.log('- RECAPTCHA_SITE_KEY:', process.env.RECAPTCHA_SITE_KEY ? 'Set' : 'Not set');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: './src/main.tsx',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? '[name].[contenthash].js' : '[name].js',
      clean: true,
      publicPath: '/'
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx']
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                '@babel/preset-env',
                ['@babel/preset-react', { runtime: 'automatic' }],
                '@babel/preset-typescript'
              ],
              comments: true
            }
          }
        },
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
            'postcss-loader'
          ]
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/[name].[hash][ext]'
          }
        }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './index.html',
        inject: 'body'
      }),
      isProduction && new MiniCssExtractPlugin({
        filename: '[name].[contenthash].css'
      }),
      new CopyWebpackPlugin({
        patterns: [
          { 
            from: 'public', 
            to: '.', 
            globOptions: { ignore: ['**/index.html'] },
            noErrorOnMissing: true
          }
        ]
      }),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
        'process.env.API_BASE_URL': JSON.stringify(process.env.API_BASE_URL || ''),
        'process.env.STRIPE_PUBLIC_KEY': JSON.stringify(process.env.STRIPE_PUBLIC_KEY || ''),
        'process.env.RECAPTCHA_SITE_KEY': JSON.stringify(process.env.RECAPTCHA_SITE_KEY || '')
      })
    ].filter(Boolean),
    devServer: {
      static: {
        directory: path.join(__dirname, 'public')
      },
      historyApiFallback: true,
      port: 3000,
      hot: true,
      open: true,
      client: {
        overlay: {
          errors: true,
          warnings: false,
          runtimeErrors: false
        }
      },
      proxy: [
        {
          context: ['/api'],
          target: 'https://www.tcgrader.com',
          changeOrigin: true,
          secure: false,
          headers: {
            'Origin': 'https://www.tcgrader.com'
          }
        }
      ]
    },
    optimization: {
      splitChunks: {
        chunks: 'all'
      }
    }
  };
};