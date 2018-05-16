'use strict';
const {Observable} = require('rx');
const ws281x = require('rpi-ws281x-native');

let DEFAULT_ON_MS = 2000;
let DEFAULT_OFF_MS = 500;
let RED = 0x00FF00;
let GREEN = 0xFF0000;
let BLUE = 0x0000FF;
let YELLOW = 0xFFFF00;
let ORANGE = 0x80FF00;

let DEFAULT_CHAR_MAP = {
  a: {pos: 0, color: GREEN},
  b: {pos: 1, color: ORANGE},
  c: {pos: 2, color: RED},
  d: {pos: 3, color: BLUE},
  e: {pos: 4, color: YELLOW},
  f: {pos: 5, color: GREEN},
  g: {pos: 6, color: ORANGE},
  h: {pos: 7, color: RED},
  i: {pos: 8, color: BLUE},
  j: {pos: 9, color: YELLOW},
  k: {pos: 10, color: GREEN},
  l: {pos: 11, color: ORANGE},
  m: {pos: 12, color: RED},
  n: {pos: 13, color: BLUE},
  o: {pos: 14, color: YELLOW},
  p: {pos: 15, color: GREEN},
  q: {pos: 16, color: ORANGE},
  r: {pos: 17, color: RED},
  s: {pos: 18, color: BLUE},
  t: {pos: 19, color: YELLOW},
  u: {pos: 20, color: GREEN},
  v: {pos: 21, color: ORANGE},
  w: {pos: 22, color: RED},
  x: {pos: 23, color: BLUE},
  y: {pos: 24, color: YELLOW},
  z: {pos: 25, color: GREEN},
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
    while(i--) this.pixelData[i] = 0;
    ws281x.render(this.pixelData);

    return Observable.just().delay(offDelay);
  },

  queuePhrase: function(phrase) {
    this.queue.push(phrase);
    if (!this.isBlinking) this.processQueue();
  },

  processQueue: function() {
    let phrase = this.queue.shift();
    if (!phrase) {
      this.isBlinking = false;
      return;
    }

    this.isBlinking = true;
    this.blinkString(phrase)
      .subscribe(() => this.processQueue());
  },

  turnOn: function() {
    while(i--) this.pixelData[i] = 0;
    if (!!ledConfig) {
      this.pixelData[ledConfig.pos] = 0xFFFFFF;
    }
    ws281x.render(this.pixelData);
    return Observable.just();
  },

  turnOff: function() {
    while(i--) this.pixelData[i] = 0;
    if (!!ledConfig) {
      this.pixelData[ledConfig.pos] = 0;
    }
    ws281x.render(this.pixelData);
    return Observable.just();
  },

  blinkChar: function(char, ms = DEFAULT_ON_MS, offDelay = DEFAULT_OFF_MS) {
    if (!(typeof char === 'string' || char instanceof String) || char.length != 1)
      return Observable.throw(new Error('Not a character'));  

    let ledConfig = this.charMap[char];
    let i = this.ledCount;
    while(i--) this.pixelData[i] = 0;
    if (!!ledConfig) {
      this.pixelData[ledConfig.pos] = ledConfig.color;
    }
    ws281x.render(this.pixelData);
  
    if (!!ledConfig) 
      return Observable.just()
        .delay(ms)
        .flatMap(() => this.holdOff(offDelay));
    
    return Observable.just();
  },

  blinkString: function(string) {
    if (!(typeof string === 'string' || string instanceof String))
      return Observable.throw(new Error('Not a string'));
  
    return Observable.from([...string])
      .concatMap(char => 
        Observable.just(char)
          .flatMap(char => this.blinkChar(char.toLowerCase())))
      .toArray();
  }
};

module.exports = {
  Lights,
  RED,
  GREEN,
  BLUE,
  YELLOW,
  ORANGE 
};