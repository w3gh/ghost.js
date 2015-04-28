'use strict';

var log = require('./../log');
var Bytes = require('./../Bytes');
var net = require('net');
var _ = require('lodash');
var GameProtocol = require('./GameProtocol');
var Map = require('./Map');

function BaseGame(ghost, map, saveGame, hostPort, gameState, gameName, ownerName, creatorName, creatorServer) {
	this.ghost = ghost;
	this.socket = new net.Server();
	this.protocol = new GameProtocol();
	this.map = (map instanceof Map) ? map : new Map(map);

	this.exiting = false;
	this.saving = false;
	this.hostCounter = ghost.hostCounter++;
	this.hostPort = hostPort;
	this.gameState = gameState;
	this.virtualHostPID = 255;
	this.fakePlayerPID = 255;
	this.gameName = gameName;
	this.lastGameName = gameName;
	this.virtualHostName = 'Map';
	this.ownerName = ownerName;

	creatorName = creatorName || 'Varlock';
	this.creatorName = creatorName;
	this.creatorServer = creatorServer;

	this.socket.on('listen', this.onListen.bind(this));
	this.socket.on('connection', this.onConnection.bind(this));

	this.socket.listen(hostPort);

	this.countDownStarted = false;

	this.lastPingTime = Date.now();
	this.lastRefreshTime = Date.now();
	this.creationTime = Date.now();
}

_.extend(BaseGame.prototype, {
	update: function () {

		var interval = Date.now() - this.lastPingTime;
		if (interval > 5000) { // refresh every 5 sec

			if (!this.countDownStarted) {
				var fixedHostCounter = this.hostCounter & 0x0FFFFFFF;

				var buffer = this.protocol.SEND_W3GS_GAMEINFO(
					this.ghost.tft,
					this.ghost.LANWar3Version,
					Bytes.ArrayUInt32(Map.MAPGAMETYPE_UNKNOWN0),
					this.map.getGameFlags(),
					this.map.getWidth(),
					this.map.getHeight(),
					this.gameName,
					this.creatorName,
					Date.now() - this.creationTime,
					this.map.getPath(),
					this.map.getCRC(),
					12,
					12,
					this.hostPort,
					fixedHostCounter
				);

				var socket = this.ghost.udpSocket;

				socket.send(buffer, 0, buffer.length, 6112, 'localhost', function (err, bytes) {
					if (err) {
						throw err;
					}

					log('localhost', 6112, 'bytes sent', bytes);
				});
			}

			this.lastPingTime = Date.now();
		}
	},
	onListen: function () {
		log('on listen', arguments);
	},
	onConnection: function () {
		log('on connection', arguments);
	}
});

module.exports = BaseGame;
