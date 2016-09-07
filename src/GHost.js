import dgram from 'dgram';
import net from 'net';
import AdminGame from './game/AdminGame';
import Map from './game/Map';
import Bot from './Bot';
import {create} from './Logger';

const {debug, info, error} = create('GProxy');

export default class GHost extends Bot {
	static run = (config) => {
		const g = new GHost(config);

		while (true) {

			// block for 50ms on all sockets -
			// if you intend to perform any timed actions more frequently you should change this
			// that said it's likely we'll loop more often than this
			// due to there being data waiting on one of the sockets but there aren't any guarantees
			if (g.update(50)) {
				break;
			}
		}

		info('shutting down');
	};

	constructor(cfg) {
		super(cfg);

		this.currentGame = null;
		this.exiting = false;
		this.exitingNice = false;

		this.hostCounter = 1;
		this.lastUpdateTime = Date.now();
		this.BNets = [];
		this.games = [];

		this.configure();
		this.udpSocketSetup();
		this.adminGameSetup();
	}

	update(msec) {

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

		this.lastUpdateTime = Date.now();

		if (this.adminGame) {
			if (this.adminGame.update()) {
				info('deleting admin game');
				delete this.adminGame;
				this.adminExit = true;
			}
		}
	}

	udpSocketSetup() {
		this.udpSocket = dgram.createSocket('udp4');
		this.udpSocket.on('listening', this.onListening);
		this.udpSocket.on('message', this.onMessage);
		this.udpSocket.on('error', this.onError);
		this.udpSocket.on('close', this.onClose);
		this.udpSocket.bind();
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

	adminGameSetup() {
		this.adminMap = new Map(this.getMapPath(this.adminGameMap));

		if (this.adminGameCreate) {
			this.adminGame = new AdminGame(this, this.adminMap, null, this.adminGamePort, 0, 'GHost++ Admin Game');
		}
	}
}