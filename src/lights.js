'use strict';
const {Observable} = require('rx');
const ws281x = require('rpi-ws281x-native');
const winston = require('winston');

let DEFAULT_ON_MS = 2000;
let DEFAULT_OFF_MS = 500;
let OFF = 0x000000;

let MAX_BRIGHTNESS = 50;

function rgb2Int(r, g, b) {
  return ((r & 0xff) << 16) + ((g & 0xff) << 8) + (b & 0xff);
}

function Lights(charMap = DEFAULT_CHAR_MAP, maxBrightness = MAX_BRIGHTNESS) {
  this.ledCount = Object.keys(charMap).length;
  this.pixelData = new Uint32Array(this.ledCount);
  this.charMap = charMap;
  this.maxBrightness = maxBrightness;
  ws281x.init(this.ledCount);
  ws281x.setBrightness(maxBrightness);
};

Lights.prototype = {
  constructor: Lights,

  setPixelDataOn: function() {
    for (var key in this.charMap) {
      if (!this.charMap.hasOwnProperty(key)) return;
      let prop = this.charMap[key]
      this.pixelData[prop.pos] = prop.color;
    } 
  },

  setPixelDataOff: function() {
    let i = this.ledCount;
    while (i--) this.pixelData[i] = 0;
  },

  reset: function() {
    ws281x.reset();
  },

  randomOff: function(offCount = 4) {
    let i = offCount;
    while(i--) {
      let pos = Math.round(Math.random() * this.ledCount);
      this.pixelData[pos] = OFF;
    }
    ws281x.render(this.pixelData);  
    return Observable.just();
  },

  animateRandomOnOff: function(duration, offCount) {
    let cycleDuration = 100;
    let cycles = duration / cycleDuration;
    return Observable.range(0, cycles)
      .concatMap(cycleNum => Observable.just(cycleNum)
        .flatMap(cycleNum => {
          this.setPixelDataOn();
          return this.randomOff(offCount);
        })
        .delay(cycleDuration))
      .toArray();
  },

  animateOn: function() {
    winston.debug('animateOn');
    return this.turnOn()
      .delay(100)
      .flatMap(() => this.turnOff())
      .delay(100)
      .flatMap(() => this.turnOn())
      .delay(100)
      .flatMap(() => this.turnOff())
      .delay(100)
      .flatMap(() => this.turnOn())
      .delay(100)
      .flatMap(() => this.turnOff())
      .delay(300)
      .flatMap(() => this.turnOn())
      .delay(100)
      .flatMap(() => this.turnOff())
      .delay(100)
      .flatMap(() => this.turnOn())
      .delay(100)
      .flatMap(() => this.turnOff())
      .delay(100)
      .flatMap(() => this.fadeOn(200));
  },

  animateOff: function() {
    winston.debug('animateOff');
    return this.animateRandomOnOff(2000)
      .flatMap(() => this.turnOff())
      .delay(500);
  },

  fadeOn: function(duration) {
    winston.debug('fadeOn', duration);
    let cycleDuration = duration / this.maxBrightness;
    ws281x.setBrightness(0);
    this.turnOn();
    return Observable.range(0, this.maxBrightness + 1)
      .concatMap(brightness => Observable.just(brightness)
          .map(ws281x.setBrightness)
          .delay(cycleDuration))
      .toArray();
  },

  fadeOff: function(duration) {
    winston.debug('fadeOff', duration);
    let cycleDuration = duration / this.maxBrightness;
    ws281x.setBrightness(0);
    this.turnOn();
    return Observable.range(0, this.maxBrightness + 1)
      .concatMap(brightness => Observable.just(this.maxBrightness - brightness)
          .map(ws281x.setBrightness)
          .delay(cycleDuration))
      .toArray();
  },

  turnOn: function() {
    winston.debug('turnOn');
    this.setPixelDataOn();
    ws281x.render(this.pixelData);
    return Observable.just();
  },

  turnOff: function() {
    winston.debug('turnOff');
    this.setPixelDataOff();
    ws281x.render(this.pixelData);
    return Observable.just();
  },

  blinkChar: function(char, ms = DEFAULT_ON_MS, offDelay = DEFAULT_OFF_MS) {
    winston.debug('blinkChar', char);
    if (!(typeof char === 'string' || char instanceof String) || char.length != 1)
      return Observable.throw(new Error('Not a character'));  

    let ledConfig = this.charMap[char];
    let i = this.ledCount;
    while(i--) this.pixelData[i] = 0;
    if (!!ledConfig) {
      this.pixelData[ledConfig.pos] = ledConfig.color;
    }
    ws281x.render(this.pixelData);
    ws281x.setBrightness(this.maxBrightness);
  
    if (!!ledConfig) 
      return Observable.just()
        .delay(ms)
        .flatMap(() => this.turnOff())
        .delay(offDelay);
    
    return Observable.just();
  },

  blinkMessage: function(string) {
    if (!(typeof string === 'string' || string instanceof String))
      return Observable.throw(new Error('Not a string'));
  
    return this.animateOff()
      .flatMap(() => {
        winston.info('Blinking: ', string);
        return Observable.from([...string])
          .concatMap(char => 
            Observable.just(char)
              .flatMap(char => this.blinkChar(char.toLowerCase())))
          .toArray();
      })
      .flatMap(() => this.animateOn());
  }
};

module.exports = Lights;