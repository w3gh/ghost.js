import dgram from 'dgram';
import net from 'net';
import path from 'path';

import {getTicks, getTime, localIP} from './util';
import {BNet} from './bnet/BNet';
import {AdminGame} from './game/AdminGame';
import {Map} from './game/Map';
import {Bot} from './Bot';
import {create} from './Logger';

const {debug, info, error} = create('GHost');

export class GHost extends Bot {
	constructor(cfg) {
		super(cfg);

		this.currentGame = null;
		this.exitingNice = false;

		this.hostCounter = 1;
		this.lastUpdateTime = Date.now();
		this.BNets = [];
		this.games = [];

		this.configure();
		this.configureBNet();

		this.extractScripts();
		this.udpSocketSetup();
		this.adminGameSetup();

		this.on('update', this.onUpdate)
	}

	onUpdate = () => {
		this.lastUpdateTime = getTime();

		if (this.exitingNice) {
			if (this.BNets.length) {
				info('deleting all battle.net connections in preparation for exiting nicely');

				this.BNets.forEach((bn) => bn.close());
				this.BNets = [];
			}

			if (this.currentGame) {
				info('deleting current game in preparation for exiting nicely');
				this.currentGame.close();
				this.currentGame = null;
			}

			if (this.adminGame) {
				info('deleting admin game in preparation for exiting nicely');
				this.adminGame.close();
				this.adminGame = null;
			}

			if (!this.games.length) {
				//@TODO handle games and child processes
			}
		}

		if (this.BNets.length) {
			for (let bnet of this.BNets) {
				if (bnet.update()) {
					this.bnetExit = true;
				}
			}
		}

		if (this.adminGame) {
			if (this.adminGame.update()) {
				info('deleting admin game');
				delete this.adminGame;
				this.adminExit = true;
			}
		}
	};

	getMapPath(filename) {
		return path.resolve(path.join(this.mapCfgPath, `${filename}.json`))
	};

	udpSocketSetup() {
		this.udpSocket = dgram.createSocket('udp4');
		this.udpSocket.on('listening', this.onListening);
		this.udpSocket.on('message', this.onMessage);
		this.udpSocket.on('error', this.onError);
		this.udpSocket.on('close', this.onClose);
		//this.udpSocket.setBroadcast(true);
	}

	extractScripts() {

	}

	onMessage = (...args) => {
		debug('Bot', 'message', ...args);
	};

	onClose = (...args) => {
		debug('Bot', 'close', ...args);
	};

	onError = (...args) => {
		debug('Bot', 'error', ...args);
	};

	onListening = (...args) => {
		debug('Bot', 'listening', ...args);
	};

	configure() {
		const config = this.cfg;

		this.TFT = config.item('tft', 1);
		this.hostPort = config.item('bot.hostport', 6112);
		this.defaultMap = config.item('bot.defaultmap', 'map');
		this.mapCfgPath = config.item('bot.mapcfgpath', './maps');
		this.war3Path = config.item('bot.war3path', 'war3');

		this.adminGameCreate = this.cfg.item('admingame.create', false);
		this.adminGamePort = this.cfg.item('admingame.port', 6114);
		this.adminGamePassword = this.cfg.item('admingame.password', '');
		this.adminGameMap = this.cfg.item('admingame.map', 'map');

		this.lanWar3Version = this.cfg.item('lan.war3version', "26");
	}

	configureBNet() {
		const config = this.cfg;

		for (let i = 0; i < 32; ++i) {
			const prefix = `bnet.${i}`;
			const prefixConfig = config.slice(prefix);

			if (prefixConfig) {
				this.BNets.push(new BNet(prefixConfig, this.TFT, this.hostPort, i));
			}
		}

		if (this.BNets.length == 0) {
			info('warning - no battle.net connections found in config file')
		}
	}

	adminGameSetup() {
		this.adminMap = new Map(this.getMapPath(this.adminGameMap));

		if (this.adminGameCreate) {
			this.adminGame = new AdminGame(this, this.adminMap, null, this.adminGamePort, 0, 'GHost++ Admin Game');
		}
	}
}