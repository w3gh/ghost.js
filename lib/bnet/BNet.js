'use strict';

var net = require('net');
var util = require('util');
var hex = require('hex');
var _ = require('lodash');
var bufferpack = require('bufferpack');
var pack = bufferpack.pack;
var BNetProtocol = require('./BNetProtocol');
var CommandPacket = require('./../CommandPacket');
var BNCSUtil = require('./BNCSUtil');
var log = require('./../log');
var ByteArray = require('./../ByteArray');

var defaults = {
	war3version: '26',
	tft: 1,
	localeID: '1033',
	countryAbbrev: 'USA',
	country: 'United States',
	port: 6112,

	exeversion: [1, 0, 26, 1],
	exeversionhash: [194, 206, 231, 242]
};

/**
 *
 * @param {String} key
 * @param {Number} clientToken
 * @param {Number} serverToken
 * @returns {Array}
 */
function createKeyInfo(key, clientToken, serverToken) {
	var info = BNCSUtil.kd_quick(key, clientToken, serverToken);

	var bytes = [];

	bytes.push(pack('<I', key.length));
	bytes.push(pack('<I', info.product.value));
	bytes.push(pack('<I', info.public_value));
	bytes.push('\x00\x00\x00\x00');
	bytes.push(info.hash);

	return bytes;
}

/**
 *
 * @param {String} server
 * @param {String} alias
 * @param {Number} port
 * @param {Object} options
 * @constructor
 */
function BNet(server, alias, port, options) {
	this.packets = [];
	this.buffer = new Buffer('');
	this.socket = new net.Socket(options);

	this.clientToken = '\xdc\x01\xcb\x07';

	this.lastPacketTime = 0;
	this.packetInterval = 4.0;

	this.server = server;
	this.alias = alias;
	this.port = port;

	this.handlers[BNetProtocol.SID_PING] = this.HANDLE_SID_PING;
	this.handlers[BNetProtocol.SID_AUTH_INFO] = this.HANDLE_SID_AUTH_INFO;
	this.handlers[BNetProtocol.SID_AUTH_CHECK] = this.HANDLE_SID_AUTH_CHECK;
	this.handlers[BNetProtocol.SID_REQUIREDWORK] = this.HANDLE_SID_REQUIREDWORK;
	this.handlers[BNetProtocol.SID_AUTH_ACCOUNTLOGON] = this.HANDLE_SID_AUTH_ACCOUNTLOGON;
	this.handlers[BNetProtocol.SID_AUTH_ACCOUNTLOGONPROOF] = this.HANDLE_SID_AUTH_ACCOUNTLOGONPROOF;
	this.handlers[BNetProtocol.SID_NULL] = this.HANDLE_SID_NULL;
	this.handlers[BNetProtocol.SID_ENTERCHAT] = this.HANDLE_SID_ENTERCHAT;
	this.handlers[BNetProtocol.SID_CHATEVENT] = this.HANDLE_SID_CHATEVENT;
	this.handlers[BNetProtocol.SID_CLANINFO] = this.HANDLE_SID_CLANINFO;
	this.handlers[BNetProtocol.SID_CLANMEMBERLIST] = this.HANDLE_SID_CLANMEMBERLIST;
	this.handlers[BNetProtocol.SID_CLANMEMBERSTATUSCHANGE] = this.HANDLE_SID_CLANMEMBERSTATUSCHANGE;
	this.handlers[BNetProtocol.SID_MESSAGEBOX] = this.HANDLE_SID_MESSAGEBOX;
	// this.handlers[BNetProtocol.SID_CLANINVITATION] =            this.HANDLE_SID_CLANINVITATION;
	// this.handlers[BNetProtocol.SID_CLANMEMBERREMOVED] =         this.HANDLE_SID_CLANMEMBERREMOVED;
	// this.handlers[BNetProtocol.SID_FRIENDSUPDATE] =             this.HANDLE_SID_FRIENDSUPDATE;
	// this.handlers[BNetProtocol.SID_FRIENDSLIST] =               this.HANDLE_SID_FRIENDSLIST;
	// this.handlers[BNetProtocol.SID_FLOODDETECTED] =             this.HANDLE_SID_FLOODDETECTED;
	// this.handlers[BNetProtocol.SID_FRIENDSADD] =                this.HANDLE_SID_FRIENDSADD;

	this.war3exePath = '';
	this.stormdllPath = '';
	this.gamedllPath = '';
}

_.extend(BNet.prototype, {
	handlers: {},

	/**
	 * @param {Buffer} buffer
	 * @param {Boolean} [immediate]
	 * @returns {*|Number}
	 */
	sendPacket: function (buffer, immediate) {
		if (Buffer.isBuffer(buffer)) {
			return this.socket.write(buffer);
		} else {
			throw 'wrong send buffer given';
		}
	},

	/**
	 *
	 * @param {Buffer} buffer
	 * @returns {null}
	 */
	extractPackets: function (buffer) {
		var len;

		if (String.fromCharCode(buffer[0]) !== BNetProtocol.BNET_HEADER_CONSTANT) {
			log('error - received invalid packet from battle.net (bad header constant), disconnecting');
			this.end();
		}

		len = BNetProtocol.getLength(buffer);

		if (len < 4) {
			log('error - received invalid packet from battle.net (bad length), disconnecting');
			this.end();
		}

		if (buffer.length >= len) {
			this.packets.push(new CommandPacket(BNetProtocol.BNET_HEADER_CONSTANT, buffer[1], buffer));
			this.buffer = buffer.slice(len);
		} else { // still waiting for rest of the packet
			return null;
		}
	},

	processPackets: function () {
		var packet;
		var receiver;
		var handler;

		while (this.packets.length) {
			packet = this.packets.pop();

			if (packet.type === BNetProtocol.BNET_HEADER_CONSTANT) {
				receiver = BNetProtocol.receivers[packet.id];
				handler = this.handlers[packet.id];

				handler.call(this, receiver(packet.buffer));
			}
		}
	},

	onConnect: function () {
		log('connected', this.alias, this.remoteAddress, this.remotePort);

		this.sendPacket(BNetProtocol.SEND_PROTOCOL_INITIALIZE_SELECTOR());
		this.sendPacket(BNetProtocol.SEND_SID_AUTH_INFO(defaults.war3version,
			defaults.tft,
			defaults.localeID,
			defaults.countryAbbrev,
			defaults.country));
	},

	onData: function (buffer) {
		this.extractPackets(buffer);
		this.processPackets();
	},

	onEnd: function () {
		log('connection end');
	},

	onError: function (error) {
		log('error ' + error);
	},

	run: function () {
		this.socket.on('connect', this.onConnect.bind(this));
		this.socket.on('data', this.onData.bind(this));
		this.socket.on('end', this.onEnd.bind(this));
		this.socket.on('error', this.onError.bind(this));
		this.socket.connect(this.port, this.server);
	},

	HANDLE_SID_PING: function (d) {
		log('HANDLE_SID_PING');
		this.sendPacket(BNetProtocol.SEND_SID_PING(d));
	},
	HANDLE_SID_AUTH_INFO: function () {
		log('HANDLE_SID_AUTH_INFO');
	},
	HANDLE_SID_AUTH_CHECK: function () {
		log('HANDLE_SID_AUTH_CHECK');
	},
	HANDLE_SID_REQUIREDWORK: function () {
		log('HANDLE_SID_REQUIREDWORK');
	},
	HANDLE_SID_AUTH_ACCOUNTLOGON: function () {
		log('HANDLE_SID_AUTH_ACCOUNTLOGON');
	},
	HANDLE_SID_AUTH_ACCOUNTLOGONPROOF: function () {
		log('HANDLE_SID_AUTH_ACCOUNTLOGONPROOF');
	},
	HANDLE_SID_NULL: function () {
		log('HANDLE_SID_NULL');
	},
	HANDLE_SID_ENTERCHAT: function () {
		log('HANDLE_SID_ENTERCHAT');
	},
	HANDLE_SID_CHATEVENT: function () {
		log('HANDLE_SID_CHATEVENT');
	},
	HANDLE_SID_CLANINFO: function () {
		log('HANDLE_SID_CLANINFO');
	},
	HANDLE_SID_CLANMEMBERLIST: function () {
		log('HANDLE_SID_CLANMEMBERLIST');
	},
	HANDLE_SID_CLANMEMBERSTATUSCHANGE: function () {
		log('HANDLE_SID_CLANMEMBERSTATUSCHANGE');
	},
	HANDLE_SID_MESSAGEBOX: function () {
		log('HANDLE_SID_MESSAGEBOX');
	}
});

module.exports = BNet;
