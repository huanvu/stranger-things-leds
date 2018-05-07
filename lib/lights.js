'use strict';
const {Observable} = require('rx');

const lights = {
  blinkPhrase: (phrase) => {
    if (!(typeof phrase === 'string' || phrase instanceof String))
      return Observable.throw(new Error('Not a string'));
  
    const chars = [...phrase];
    return Observable.from(chars)
      .concatMap(char => 
        Observable.just(char)
          .flatMap(lights.blinkChar))
      .toArray();
  },
  
  blinkChar: (char) => {
    if (!(typeof char === 'string' || char instanceof String) || char.length != 1)
      return Observable.throw(new Error('Not a character'));
  
    return Observable.just();
  }
};


module.exports = lights;