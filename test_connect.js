require('babel-register');
var hex = require('hex');
var BNet = require('./src/bnet/BNet').default;
var Config = require('./src/Config').default;
var BNetProtocol = require('./src/bnet/BNetProtocol').default;

const argv = require('yargs').config().argv;

var config = new Config(argv);
var inst = new BNet(config);

inst.run();

//hex(Buffer.from([58]));

// console.log(Buffer.from([80]).toString('hex'));
// console.log(String.fromCharCode('80'));
// console.log(String.fromCharCode('80') === BNetProtocol.SID_AUTH_INFO);

//GPROXY
// 000000   01 FF 50 3A 00 00 00 00 00 36 38 58 49 50 58 33   .ÿP:.....68XIPX3
// 000010   57 18 00 00 00 53 55 6E 65 7F 00 00 01 2C 01 00   W....SUne....,..
// 000020   00 09 04 00 00 09 04 00 00 55 53 41 00 55 6E 69   .........USA.Uni
// 000030   74 65 64 20 53 74 61 74 65 73 00                  ted States.

//BNET
// 000000   01 FF 50 33 61 00 00 00 00 36 38 58 49 58 50 33   .ÿP3a....68XIXP3
// 000010   57 1A 00 00 00 53 55 6E 65 7F 00 00 01 2C 01 00   W....SUne....,..
// 000020   00 31 30 33 33 31 30 33 33 55 53 41 00 55 6E 69   .10331033USA.Uni
// 000030   74 65 64 20 53 74 61 74 65 73 00                  ted States.