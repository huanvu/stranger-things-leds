
'use strict';
const COLORS = {
  "RED": 0x00FF00,
  "GREEN": 0xFF0000,
  "BLUE": 0x0000FF,
  "YELLOW": 0xFFFF00,
  "ORANGE": 0x80FF00
}

module.exports = {
  convertCharMapColorsToRGB: (charMap) => {
    for (var key in charMap) {
      if (!charMap.hasOwnProperty(key)) continue;
    
      var char = charMap[key];
      if (typeof char.color === 'string' || char.color instanceof String) {
        if (!COLORS[char.color]) {
          throw new Error(`${COLORS[char.color]} not a valid color`);
        }
        char.color = COLORS[char.color]
      }
    }
  }
}