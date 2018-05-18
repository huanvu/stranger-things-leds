const { Lights, GREEN, ORANGE, RED, BLUE, YELLOW } = require('./lights');
const { Controller } = require('./controller');
const winston = require('winston');
const express = require('express');
const bodyParser = require('body-parser');
const port = 3000

const NUM_LEDS = 31;
let CHAR_MAP = {
  a: {pos: 23, color: BLUE},
  b: {pos: 24, color: YELLOW},
  c: {pos: 25, color: GREEN},
  d: {pos: 26, color: ORANGE},
  e: {pos: 27, color: RED},
  f: {pos: 28, color: BLUE},
  g: {pos: 29, color: YELLOW},
  h: {pos: 30, color: GREEN},
  i: {pos: 19, color: YELLOW},
  j: {pos: 18, color: BLUE},
  k: {pos: 17, color: RED},
  l: {pos: 16, color: ORANGE},
  m: {pos: 15, color: GREEN},
  n: {pos: 14, color: YELLOW},
  o: {pos: 13, color: BLUE},
  p: {pos: 12, color: RED},
  q: {pos: 11, color: ORANGE},
  r: {pos: 0, color: GREEN},
  s: {pos: 1, color: ORANGE},
  t: {pos: 2, color: RED},
  u: {pos: 3, color: BLUE},
  v: {pos: 4, color: YELLOW},
  w: {pos: 5, color: GREEN},
  x: {pos: 6, color: ORANGE},
  y: {pos: 7, color: YELLOW},
  z: {pos: 8, color: GREEN},

  9: {pos: 9, color: BLUE},
  10: {pos: 10, color: YELLOW},

  20: {pos: 20, color: GREEN},
  21: {pos: 21, color: ORANGE},
  22: {pos: 22, color: RED}
}

const lights = new Lights(NUM_LEDS, CHAR_MAP);
const controller = new Controller(lights);

winston.level = 'debug';

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
  res.sendStatus(200);
});

app.delete('/api/queue', (req, res) => {
  controller.clearQueue();
  res.sendStatus(200);
});

app.listen(port, (err) => {
  if (err) return winston.error('Unable to start web server', err)

  winston.info(`Web server listening on ${port}`)
  controller.start();
});