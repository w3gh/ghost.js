'use strict';

var hex = require('hex');
var bp = require('bufferpack');


console.log(bp.pack('<I', 0x30));
console.log(bp.unpack('<I', [0xB3, 0x0B, 0x00, 0x00]));
console.log(bp.unpack('<I', [0xA8, 0x13, 0x00, 0x00]));
console.log(bp.unpack('<H', [0x87, 0x00]));
console.log(bp.unpack('<H', [0x38, 0x37]));
// hex();
