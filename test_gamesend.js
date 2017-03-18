'use strict';

var buf = new Buffer([0xE0, 0x17]);
var dgram = require('dgram');

// 1.27b
0000   f7 30 97 00 50 58 33 57 1b 00 00 00 ba 02 00 00  .0..PX3W........
0010   ba 02 00 00 7c 63 46 46 34 30 38 30 43 30 53 45  ....|cFF4080C0SE
0020   4e 44 20 54 48 45 20 55 4e 44 45 41 44 20 42 41  ND THE UNDEAD BA
0030   43 4b 20 00 00 81 03 49 07 01 01 c1 07 e5 c1 07  CK ....I........
0040   f7 09 53 a1 4d cb 61 71 73 5d 45 6f 77 19 6f 6d  ..S.M.aqs]Eow.om
0050   6f 61 65 5d 49 27 61 75 6f 75 65 65 21 3d 49 6f  oae]I'auouee!=Io
0060   75 73 65 21 77 6f 31 31 35 2f 77 33 79 85 01 45  use!wo115/w3y..E
0070   6f 75 2f 49 6f eb 73 75 69 6f 67 31 31 01 01 01  ou/Io.suiog11...
0080   00 0c 00 00 00 01 00 00 00 01 00 00 00 0c 00 00  ................
0090   00 2b 00 00 00 ed 17                             .+.....

var buff = new Buffer(gameinfo);

var socket = dgram.createSocket('udp4');

setInterval(function () {
	socket.send(buff, 0, buff.length, 6112, 'localhost', function (err, bytes) {
		if (err) {
			throw err;
		}

		console.log('255.255.255.255', 6112, 'bytes sent', bytes);
	});
}, 5000);


