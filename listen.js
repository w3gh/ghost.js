var PORT = 6112;
var HOST = '127.0.0.1';

var dgram = require('dgram');
var hex = require('hex');
var server = dgram.createSocket('udp4');

server.on('listening', function () {
	var address = server.address();
	console.log('UDP Server listening on ' + address.address + ":" + address.port);
});

server.on('message', function (message, remote) {
	console.log(remote.address + ':' + remote.port);
	hex(message);
});

server.bind(PORT, HOST);
