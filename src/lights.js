'use strict';
const {Observable} = require('rx');
const ws281x = require('rpi-ws281x-native');

let DEFAULT_ON_MS = 2000;
let DEFAULT_OFF_MS = 500;
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

function rgb2Int(r, g, b) {
  return ((r & 0xff) << 16) + ((g & 0xff) << 8) + (b & 0xff);
}

function Lights(ledCount, charMap = DEFAULT_CHAR_MAP) {
  this.ledCount = ledCount;
  this.pixelData = new Uint32Array(this.ledCount);
  this.charMap = charMap;
  this.queue = [];
  ws281x.init(this.ledCount);
};

Lights.prototype = {
  constructor: Lights,

  reset: function() {
    ws281x.reset();
  },

  holdOff: function(offDelay) {
    let i = this.ledCount;
    while(i--) {
      this.pixelData[i] = 0;
    }
    ws281x.render(this.pixelData);

    return Observable.just().delay(offDelay);
  },

  queuePhrase: function(phrase) {
    this.queue.push(phrase);
    if (!this.isBlinking)
      this.processQueue();
  },

  processQueue: function() {
    let phrase = this.queue.shift();
    if (!phrase) {
      this.isBlinking = false;
      return;
    }

    this.isBlinking = true;
    this.blinkPhrase(phrase)
      .subscribe(() => this.processQueue());
  },

  blinkChar: function(char, color = 0xff0000, ms = DEFAULT_ON_MS, offDelay = DEFAULT_OFF_MS) {
    if (!(typeof char === 'string' || char instanceof String) || char.length != 1)
      return Observable.throw(new Error('Not a character'));  

    let ledPos = this.charMap[char];
    let i = this.ledCount;
    while(i--) this.pixelData[i] = 0;
    if (ledPos >= 0) {
      console.log('turning on led for: ', char)
      this.pixelData[ledPos] = color;
    }
    ws281x.render(this.pixelData);
  
    if (ledPos >= 0) 
      return Observable.just()
        .delay(ms)
        .flatMap(() => this.holdOff(offDelay));
    
    return Observable.just();
  },

  blinkPhrase: function(phrase) {
    if (!(typeof phrase === 'string' || phrase instanceof String))
      return Observable.throw(new Error('Not a string'));
  
    return Observable.from([...phrase])
      .concatMap(char => 
        Observable.just(char)
          .flatMap(char => this.blinkChar(char.toLowerCase())))
      .toArray();
  }
};

module.exports = Lights;