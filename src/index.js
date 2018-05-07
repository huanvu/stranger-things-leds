const Lights = require('./lights');
const express = require('express');
const bodyParser = require('body-parser');
const port = 3000

const NUM_LEDS = 100;
const lights = new Lights(NUM_LEDS);

// ---- trap the SIGINT and reset before exit
process.on('SIGINT', function () {
  lights.reset();
  process.nextTick(function () { process.exit(0); });
});

const app = express();
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

app.post('/api/queue', (req, res) => {
  let {message} = req.body;
  if (message) lights.queuePhrase(message);
  res.sendStatus(200);
});

app.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }

  console.log(`server is listening on ${port}`)
});