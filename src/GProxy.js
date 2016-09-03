import net from 'net';
import dgram from 'dgram';
import {debug, info} from './Logger';
import Bytes from './Bytes';
import AdminGame from './game/AdminGame';
import Map from './game/Map';
import Bot from './Bot';
import BNet from './bnet/BNet';
import GameProtocol from './game/GameProtocol';

export default class GProxy extends Bot {
	static run = (config) => {
		return new GProxy(config);
	};

	constructor(cfg) {
		super(cfg);

		this.version = 'Public Test Release 1.0 (March 11, 2010)';

		this.localServer = net.createServer();
		this.localSocket = null;

		this.remoteSocket = net.createConnection();
		this.udpSocket = dgram.createSocket('udp4');
		//this.udpSocket.setBroadcast(true);

		this.gameProtocol = new GameProtocol();
		this.GPSProtocol = null;

		this.totalPacketsReceivedFromLocal = 0;
		this.totalPacketsReceivedFromRemote = 0;

		this.exiting = false;

		this.tft = this.cfg.item('tft', 1);
		this.war3Path = this.cfg.item('war3path', false);
		this.cdKeyROC = this.cfg.item('cdkeyroc');
		this.cdKeyTFT = this.cfg.item('cdkeytft');
		this.server = this.cfg.item('server');
		this.username = this.cfg.item('username');
		this.password = this.cfg.item('password');
		this.channel = this.cfg.item('channel');
		this.war3Version = this.cfg.item('war3Version');
		this.port = this.cfg.item('port');

		this.lastConnectionAttemptTime = 0;
		this.lastRefreshTime = 0;
		this.remoteServerPort = 0;
		this.gameIsReliable = false;
		this.GameStarted = false;
		this.LeaveGameSent = false;
		this.ActionReceived = false;
		this.Synchronized = false;
		this.ReconnectPort = false;
		this.PID = 255;
		this.chatPID = 255;
		this.reconnectKey = 0;
		this.NumEmptyActions = 0;
		this.NumEmptyActionsUsed = 0;
		this.LastAckTime = 0;
		this.LastActionTime = 0;
		//this.BNET = new BNet(this.server, '', this.port);

		this.localServer.listen(this.port);
//
// 	m_BNET = new CBNET( this, m_Server, string( ), 0, 0, m_CDKeyROC, m_CDKeyTFT, "USA", "United States", m_Username, m_Password, m_Channel, m_War3Version, nEXEVersion, nEXEVersionHash, nPasswordHashType, 200 );

		info('GProxy', 'version', this.version);
	}

	configure() {
		this.tft = this.cfg.item('tft', 1);
		this.hostPort = this.cfg.item('bot.hostport', 6112);
		this.defaultMap = this.cfg.item('bot.defaultmap', 'map');
		this.mapCfgPath = this.cfg.item('bot.mapcfgpath', 'maps');

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
		this.adminMap = new Map(this.adminGameMap);

		if (this.adminGameCreate) {
			this.adminGame = new AdminGame(this, this.adminMap, null, this.adminGamePort, 0, 'GHost++ Admin Game');
		}
	}
}
