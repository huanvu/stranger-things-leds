'use strict';
const {Observable} = require('rx');
const ws281x = require('rpi-ws281x-native');

let DEFAULT_CHAR_MAP = {
  a: 0,
  b: 1,
  c: 2,
  d: 3,
  e: 4,
  f: 5,
  g: 6,
  h: 7,
  i: 8,
  j: 9,
  k: 10,
  l: 11,
  m: 12,
  n: 13,
  o: 14,
  p: 15,
  q: 16,
  r: 17,
  s: 18,
  t: 19,
  u: 20,
  v: 21,
  w: 22,
  x: 23,
  y: 24,
  z: 25
}
function Lights(ledCount) {
  this.ledCount = ledCount;
  this.pixelData = new Uint32Array(this.ledCount);
};

Lights.prototype = {
  constructor: Lights,

  reset: function() {
    ws281x.reset();
  },

  blinkChar: function(char, color = 0xffffff, ms = 1000) {
    if (!(typeof char === 'string' || char instanceof String) || char.length != 1)
      return Observable.throw(new Error('Not a character'));

    var i = this.ledCount;
    while(i--) {
        pixelData[i] = 0;
    }
    pixelData[0] = 0xffffff;
    ws281x.render(pixelData);
  
    return Observable.delay(ms);
  },

  blinkPhrase: function(phrase) {
    if (!(typeof phrase === 'string' || phrase instanceof String))
      return Observable.throw(new Error('Not a string'));
  
    return Observable.from([...phrase])
      .concatMap(char => 
        Observable.just(char)
          .flatMap(char => this.blinkChar(char)))
      .toArray();
  }
};

module.exports = Lights;