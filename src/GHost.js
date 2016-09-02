import util from 'util';
import path from 'path';
import dgram from 'dgram';
import log from './log';
import Config from './Config';
import Bytes from './Bytes';
import AdminGame from './game/AdminGame';
import Map from './game/Map';

export default class GHost {
	static run = (config) => {
		return new GHost(config);
	};

	constructor(cfg) {
		this.cfg = new Config(cfg);

		this.currentGame = null;
		this.exiting = false;
		this.hostCounter = 1;

		this.lastUpdateTime = Date.now();

		this.configure();
		this.udpSocketSetup();
		this.adminGameSetup();
	}

	getMapPath = (filename) => path.resolve(path.join(this.mapCfgPath, `${filename}.json`));

	udpSocketSetup() {
		this.udpSocket = dgram.createSocket('udp4');
		this.udpSocket.on('listening', this.onListening);
		this.udpSocket.on('message', this.onMessage);
		this.udpSocket.on('error', this.onError);
		this.udpSocket.on('close', this.onClose);
		this.udpSocket.bind();
	}

	onMessage = () => {
		log('Ghost message', arguments);
	};

	onClose = () => {
		log('Ghost close', arguments);
	};

	onError = () => {
		log('Ghost error', arguments);
	};

	onListening = () => {
		log('Ghost listening');
	};

	configure() {
		this.tft = this.cfg.item('tft', 1);
		this.hostPort = this.cfg.item('bot.hostport', 6112);
		this.defaultMap = this.cfg.item('bot.defaultmap', 'map');
		this.mapCfgPath = this.cfg.item('bot.mapcfgpath', './maps');

		this.adminGameCreate = this.cfg.item('admingame.create', 1);
		this.adminGamePort = this.cfg.item('admingame.create', 6114);
		this.adminGamePassword = this.cfg.item('admingame.password', '');
		this.adminGameMap = this.cfg.item('admingame.map', 'map');

		this.LANWar3Version = this.cfg.item('lan.war3version', 26);
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
		this.adminMap = new Map(this.getMapPath(this.adminGameMap));

		if (this.adminGameCreate) {
			this.adminGame = new AdminGame(this, this.adminMap, null, this.adminGamePort, 0, 'GHost++ Admin Game');
		}
	}
}