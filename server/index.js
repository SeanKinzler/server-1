/* eslint consistent-return:0 */

const express = require('express');
const logger = require('./logger');
const fs = require('fs');
const path = require('path');

const argv = require('minimist')(process.argv.slice(2));
const setup = require('./middlewares/frontendMiddleware');
const isDev = process.env.NODE_ENV !== 'production';
const ngrok = (isDev && process.env.ENABLE_TUNNEL) || argv.tunnel ? require('ngrok') : false;
const resolve = require('path').resolve;
const app = express();

const serverConfig = {
  key: fs.readFileSync(path.join(__dirname, './credentials/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, './credentials/cert.pem')),
  // ca: fs.readFileSync(path.join(__dirname, './credentials/chain.pem'))
};


// If you need a backend, e.g. an API, add your custom backend-specific middleware here
// app.use('/api', myApi);

// In production we need to pass these values in instead of relying on webpack
setup(app, {
  outputPath: resolve(process.cwd(), 'build'),
  publicPath: '/',
});

// get the intended port number, use port 3000 if not provided
const port = argv.port || process.env.PORT || 3000;

const server = require('https').createServer(serverConfig, app);
// Start your app.
server.listen(port, (err) => {
  if (err) {
    return logger.error(err.message);
  }

  // Connect to ngrok in dev mode
  if (ngrok) {
    ngrok.connect(port, (innerErr, url) => {
      if (innerErr) {
        return logger.error(innerErr);
      }

      logger.appStarted(port, url);
    });
  } else {
    logger.appStarted(port);
  }
});
