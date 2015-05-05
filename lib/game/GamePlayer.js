'use strict';

var util = require('util');
var hex = require('hex');
var net = require('net');
var _ = require('lodash');
var bp = require('bufferpack');
var log = require('./../log');
var Bytes = require('./../Bytes');
var GameProtocol = require('./GameProtocol');
var CommandPacket = require('../CommandPacket');
var Protocol = require('../Protocol');

/**
 * Potential connecting player
 * @param {GameProtocol} protocol
 * @param {BaseGame} game
 * @param {net.Socket} socket
 * @constructor
 */
function PotentialPlayer(protocol, game, socket) {
	Protocol.call(this);

	this.deleteMe = false;
	this.game = game;
	this.socket = socket;
	this.protocol = protocol;
	this.packets = [];

	this.socketSetup();
}

util.inherits(PotentialPlayer, Protocol);

_.extend(PotentialPlayer.prototype, {

	/**
	 * @param {Buffer} buffer
	 */
	send: function (buffer) {
		this.socket.write(buffer);
	},

	socketSetup: function () {
		this.socket.on('lookup', this.onLookup.bind(this));
		this.socket.on('connect', this.onConnect.bind(this));
		this.socket.on('data', this.onData.bind(this));
		this.socket.on('end', this.onEnd.bind(this));
		this.socket.on('timeout', this.onTimeout.bind(this));
		this.socket.on('drain', this.onDrain.bind(this));

		this.socket.on('error', this.onError.bind(this));
		this.socket.on('close', this.onClose.bind(this));

	},

	onLookup: function () {
		log('PotentialPlayer lookup', arguments);
	},

	onConnect: function () {
		log('PotentialPlayer connect', arguments);
	},

	onData: function (buffer) {
		log('PotentialPlayer data');
		hex(buffer);

		this.extractPackets(buffer);
		this.processPackets();
	},

	onEnd: function () {
		log('PotentialPlayer end');
	},

	onTimeout: function () {
		log('PotentialPlayer timeout', arguments);
	},

	onDrain: function () {
		log('PotentialPlayer drain', arguments);
	},

	onError: function () {
		log('PotentialPlayer error', arguments);
	},

	onClose: function () {
		log('PotentialPlayer close', arguments);
	},

	setDeleteMe: function(value) {
		this.deleteMe = value;
	},

	getExternalIP: function () {
		var zeros = [0, 0, 0, 0];
	},

	extractPackets: function (buffer) {
		var len = this.getLength(buffer);

		if (Bytes.Header(buffer) !== GameProtocol.W3GS_HEADER_CONSTANT) {
			log('error - received invalid packet from player (bad header constant)');
			this.socket.end();
		}

		if (len < 4) {
			log('error - received invalid packet from player (bad length)');
			this.socket.end();
		}

		if (buffer.length >= len) {
			this.packets.push(new CommandPacket(buffer[0], buffer[1], buffer));
			this.buffer = buffer.slice(len);
		}
	},

	processPackets: function () {
		var packet;

		while (this.packets.length) {
			packet = this.packets.pop();

			if (packet.type === GameProtocol.W3GS_HEADER_CONSTANT) {
				switch (packet.id) {
					case GameProtocol.W3GS_REQJOIN:
						delete this.incomingJoinPlayer;
						this.incomingJoinPlayer = this.protocol.RECEIVE_W3GS_REQJOIN(packet.buffer);

						if (this.incomingJoinPlayer) {
							this.game.emit('player.joined', this, this.incomingJoinPlayer);
						}

						// don't continue looping because there may be more packets waiting and this parent class doesn't handle them
						// EventPlayerJoined creates the new player, NULLs the socket, and sets the delete flag on this object so it'll be deleted shortly
						// any unprocessed packets will be copied to the new CGamePlayer in the constructor or discarded if we get deleted because the game is full
						break;
				}
			}
		}
	}
});

function GamePlayer() {
	PotentialPlayer.call(this);

	this.isLeftMessageSent = false;
}

util.inherits(GamePlayer, PotentialPlayer);

module.exports = GamePlayer;
module.exports.Potential = PotentialPlayer;
