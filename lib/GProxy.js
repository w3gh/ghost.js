'use strict';

var util = require('util');
var dgram = require('dgram');
var log = require('./log');
var Config = require('./Config');
var Bytes = require('./Bytes');
var AdminGame = require('./game/AdminGame');
var Map = require('./game/Map');

export default class GProxy {
	constructor() {
		this.cfg = new Config();

		this.currentGame = null;
		this.exiting = false;
		this.hostCounter = 1;

		this.lastUpdateTime = Date.now();

		this.configure();
		this.udpSocketSetup();
		this.adminGameSetup();
	}


	onMessage() {
		log('Ghost message', arguments);
	}

	onClose() {
		log('Ghost close', arguments);
	}

	onError() {
		log('Ghost error', arguments);
	}

	onListening() {
		log('Ghost listening');
	}

	udpSocketSetup() {
		this.udpSocket = dgram.createSocket('udp4');
		this.udpSocket.on('listening', this.onListening.bind(this));
		this.udpSocket.on('message', this.onMessage.bind(this));
		this.udpSocket.on('error', this.onError.bind(this));
		this.udpSocket.on('close', this.onClose.bind(this));
		this.udpSocket.bind();
	}

	configure() {
		this.tft = this.cfg.get('tft', 1);
		this.hostPort = this.cfg.get('bot.hostport', 6112);
		this.defaultMap = this.cfg.get('bot.defaultmap', 'map');
		this.mapCfgPath = this.cfg.get('bot.mapcfgpath', 'maps');

		this.adminGameCreate = this.cfg.get('admingame.create', 1);
		this.adminGamePort = this.cfg.get('admingame.create', 6114);
		this.adminGamePassword = this.cfg.get('admingame.password', '');
		this.adminGameMap = this.cfg.get('admingame.map', 'map');

		this.LANWar3Version = this.cfg.get('lan.war3version', 26);
	}

	update() {
		this.lastUpdateTime = Date.now();

		if (this.adminGame) {
			if (this.adminGame.update()) {
				log('deleting admin game');
				delete this.adminGame;
				this.adminExit = true;
			}
		}
	}

	adminGameSetup() {
		this.adminMap = new Map(this, this.adminGameMap);

		if (this.adminGameCreate) {
			this.adminGame = new AdminGame(this, this.adminMap, null, this.adminGamePort, 0, 'GHost++ Admin Game');
		}
	}
}
