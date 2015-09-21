'use strict';

import util from 'util';
import _ from 'lodash';
import dgram from 'dgram';
import log from './log';
import Config from './Config';
import Bytes from './Bytes';
import AdminGame from './game/AdminGame';
import Map from './game/Map';

export default class GHost {
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
		this.tft = this.cfg.getItem('tft', 1);
		this.hostPort = this.cfg.getItem('bot.hostport', 6112);
		this.defaultMap = this.cfg.getItem('bot.defaultmap', 'map');
		this.mapCfgPath = this.cfg.getItem('bot.mapcfgpath', 'maps');

		this.adminGameCreate = this.cfg.getItem('admingame.create', 1);
		this.adminGamePort = this.cfg.getItem('admingame.create', 6114);
		this.adminGamePassword = this.cfg.getItem('admingame.password', '');
		this.adminGameMap = this.cfg.getItem('admingame.map', 'map');

		this.LANWar3Version = this.cfg.getItem('lan.war3version', 26);
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