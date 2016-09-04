var PORT = 6112;
var HOST = '127.0.0.1';

var dgram = require('dgram');
var net = require('net');
var hex = require('hex');
var server = net.createServer(function (c) {
	c.on('data', function (message) {
		hex(message);
	});
}); //dgram.createSocket('udp4');

server.on('listening', function () {
	var address = server.address();
	console.log('Server listening on ' + address.address + ":" + address.port);
});

server.on('message', function (message, remote) {
	console.log(remote.address + ':' + remote.port);
	hex(message);
});

server.on('connection', function (message, remote) {
	console.log('client connected');
	//hex(message);
});

server.listen(PORT);
