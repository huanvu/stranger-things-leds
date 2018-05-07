const Lights = require('./lib/lights');

const NUM_LEDS = 100;
const lights = new Lights(NUM_LEDS);

// ---- trap the SIGINT and reset before exit
process.on('SIGINT', function () {
  lights.reset();
  process.nextTick(function () { process.exit(0); });
});

lights.blinkPhrase('huan');