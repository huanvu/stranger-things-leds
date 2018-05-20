const Lights = require('./src/lights');
const Controller = require('./src/controller');
const { convertCharMapColorsToRGB } = require('./src/utils');
const winston = require('winston');
const express = require('express');
const bodyParser = require('body-parser');
const port = 3000

let charMap;
try {
  charMap = require('./charmap.json');
  convertCharMapColorsToRGB(charMap);
} catch (err) {
  winston.error('Unable to load charmap', err);
  return;
}

let messages;
try {
  messages = require('./messages.json');
} catch (err) {
  winston.warn('messages.json not found, play of random messages disabled');
  messages = [];
}

let config;
try {
  config = require('./config.json');
} catch (err) {
  winston.warn('config.json not found, connection alerts disabled');
  config = {};
}

const lights = new Lights(charMap, config.maxBrightness);
const controller = new Controller(lights, messages, config);

winston.level = config.logLevel || 'info';

// ---- trap the SIGINT and reset before exit
process.on('SIGINT', function () {
  controller.stop();
  process.nextTick(function () { process.exit(0); });
});

const app = express();
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use(express.static('html'))

app.post('/api/queue', (req, res) => {
  let {message} = req.body;
  if (message) controller.queueMessage(message);
  res.send(JSON.stringify(controller.getStatus()));
});

app.delete('/api/queue', (req, res) => {
  controller.clearQueue();
  res.send(JSON.stringify(controller.getStatus()));
});

app.get('/api/status', (req, res) => {
  res.send(JSON.stringify(controller.getStatus()));
});

app.listen(port, (err) => {
  if (err) return winston.error('Unable to start web server', err)

  winston.info(`Web server listening on ${port}`)
  controller.start();
});