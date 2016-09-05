'use strict';

var hex = require('hex');
var bp = require('bufferpack');

//
// console.log(bp.pack('<I', 0x30));
// console.log(bp.unpack('<I', [0xB3, 0x0B, 0x00, 0x00]));
// console.log(bp.unpack('<I', [0xA8, 0x13, 0x00, 0x00]));
// console.log(bp.unpack('<H', [0x87, 0x00]));
// console.log(bp.unpack('<H', [0x38, 0x37]));
// console.log(bp.unpack('<H', Buffer.from([0x80, 0x88, 0x51, 0x87])));

console.log(bp.pack('<I', 'W3XP')); //[0x80, 0x88, 0x51, 0x87]
console.log(Buffer.from('W3XP'));
console.log(Buffer.from('W3XP').toJSON());
console.log(Buffer.from([80, 88, 51, 87]).toString('utf8'));
console.log(Buffer.from([44, 1, 0, 0]).toString('utf8'));
// hex();
console.log(Buffer.allocUnsafe(4));
console.log(Buffer.from('\x00\x00\x00\x00'));