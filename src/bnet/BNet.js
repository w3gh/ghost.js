import net from 'net';
import bp from 'bufferpack';
import assert from 'assert';
import path from 'path';
import EventEmitter from 'events';
import {getTicks, getTime} from './../util';
import {BytesExtract, GetLength, AsHex} from './../Bytes';
import {BNetProtocol} from './BNetProtocol';
import {Plugin} from '../Plugin';
import {CommandPacket} from '../CommandPacket';
import {BNCSUtil} from './../BNCSUtil';
import {create, hex} from '../Logger';

const {debug, info, error} = create('BNet');

/**
 * Class for connecting to battle.net
 * @param {Object} options
 * @constructor
 */
export class BNet extends EventEmitter {
	constructor(config, TFT, hostPort, hostCounterID) {
		super();

		if (!config) {
			info(`empty config for battle.net connection #${this.id}`);
			return;
		}

		this.id = hostCounterID;
		this.hostPort = hostPort;
		this.TFT = TFT;
		this.configure(config);

		if (!this.enabled) {
			return;
		}

		info(`found battle.net connection [#${this.id}] for server [${this.server}]`);

		this.socket = new net.Socket();
		this.protocol = new BNetProtocol(this);
		this.bncs = new BNCSUtil();

		this.data = Buffer.from('');
		this.incomingPackets = [];
		this.incomingBuffer = Buffer.from('');

		this.clientToken = Buffer.from('\xdc\x01\xcb\x07', 'binary');
		this.admins = [];
		this.outPackets = [];

		this.connected = false;
		this.connecting = false;
		this.exiting = false;

		this.lastDisconnectedTime = 0;
		this.lastConnectionAttemptTime = 0;
		this.lastNullTime = 0;
		this.lastOutPacketTicks = 0;
		this.lastOutPacketSize = 0;
		this.frequencyDelayTimes = 0;

		this.firstConnect = true;
		this.waitingToConnect = true;
		this.loggedIn = false;
		this.inChat = false;
		this.inGame = false;

		this.configureSocket();
		this.configureHandlers();
		this.configurePlugins();

		this.on('talk', (that, event) => {
			if (event.message === '?trigger') {
				this.queueChatCommand(`Command trigger is ${this.commandTrigger}`);
			}
		});

		this.on('command', (that, argv) => {
			console.log('got command', argv);
		});
	}

	configure(config) {
		this.enabled = config.item('enabled', true);
		this.server = config.item('server');
		this.alias = config.item('alias');

		this.bnlsServer = config.item('bnls.server', false);
		this.bnlsPort = config.item('bnls.port', 9367);
		this.bnlsWardenCookie = config.item('bnls.wardencookie', false);

		this.commandTrigger = config.item('commandtrigger', '!');
		assert(this.commandTrigger !== '', 'command trigger empty');

		this.war3version = config.item('custom.war3version', '26');
		this.exeVersion = config.item('custom.exeversion', false);
		this.exeVersionHash = config.item('custom.exeversionhash', false);
		this.passwordHashType = config.item('custom.passwordhashyype', '');
		this.pvpgnRealmName = config.item('custom.pvpgnrealmname', 'PvPGN Realm');
		this.maxMessageLength = config.item('custom.maxmessagelength', 200);

		this.localeID = config.item('localeid', 1049); //Russian
		this.countryAbbrev = config.item('countryabbrev', 'RUS');
		this.country = config.item('country', 'Russia');
		this.language = config.item('language', 'ruRU');
		this.timezone = config.item('timezone', 300);

		this.war3Path = path.resolve(config.item('war3path', './war3'));
		this.war3exePath = path.resolve(config.item('war3exe', 'war3.exe'));
		this.stormdllPath = path.resolve(config.item('stormdll', 'Storm.dll'));
		this.gamedllPath = path.resolve(config.item('gamedll', 'game.dll'));

		this.keyROC = config.item('keyroc', 'FFFFFFFFFFFFFFFFFFFFFFFFFF');
		assert(this.keyROC !== '', 'ROC CD-Key empty');
		this.keyTFT = config.item('keytft', 'FFFFFFFFFFFFFFFFFFFFFFFFFF');
		assert(this.keyTFT !== '', 'TFT CD-Key empty');

		this.username = config.item('username', '');
		assert(this.username !== '', 'username empty');
		this.password = config.item('password', '');
		assert(this.password !== '', 'password empty');

		this.firstChannel = config.item('firstchannel', 'The Void');
		this.rootAdmin = config.item('rootadmin', false);
		this.plugins = config.item('plugins', {});
	}

	configureSocket() {
		this.socket
			.on('close', () => {
				info(`[${this.alias}] connection close`);
				this.connected = false;
				this.connecting = false;
			})

			.on('connect', () => {
				this.connected = true;
				this.connecting = true;
			})

			.on('data', (buffer) => {
				info(`[${this.alias}] connection receive`);
				hex(buffer);

				this.incomingBuffer = Buffer.concat([this.incomingBuffer, buffer]);

				this.extractPackets();
				this.processPackets();
			})

			.on('drain', (...args) => {
				info(`[${this.alias}] connection drain`, ...args);
			})

			.on('end', (...args) => {
				info(`[${this.alias}] connection end`, ...args);
			})

			.on('error', (err) => {
				info(`[${this.alias}] disconnected from battle.net due to socket error ${err}`);

				this.lastDisconnectedTime = getTime();
				this.loggedIn = false;
				this.inChat = false;
				this.waitingToConnect = true;
				this.connected = false;
				this.connecting = false;
			})

			.on('lookup', () => {
				info(`[${this.alias}] connection lookup`);
			})

			.on('timeout', () => {
				info(`[${this.alias}] connection timeout`);
			});
	}

	configureHandlers() {
		this.handlers = {};

		for (let type of [
			'SID_PING',
			'SID_AUTH_INFO',
			'SID_AUTH_CHECK',
			'SID_AUTH_ACCOUNTLOGON',
			'SID_AUTH_ACCOUNTLOGONPROOF',
			'SID_REQUIREDWORK',
			'SID_NULL',
			'SID_ENTERCHAT',
			'SID_CHATEVENT',
			'SID_CLANINFO',
			'SID_CLANMEMBERLIST',
			'SID_CLANMEMBERSTATUSCHANGE',
			'SID_MESSAGEBOX',
			'SID_CLANINVITATION',
			'SID_CLANMEMBERREMOVED',
			'SID_FRIENDSUPDATE',
			'SID_FRIENDSLIST',
			'SID_FLOODDETECTED',
			'SID_FRIENDSADD',
			'SID_GETADVLISTEX'
		]) {
			this.handlers[this.protocol[type].charCodeAt(0)] = this[`HANDLE_${type}`];
		}
	}

	configurePlugins() {
		Plugin.emit('onBNetInit', this);
	}

	/**
	 * @param {Buffer|Array} buffer
	 * @returns {*|Number}
	 */
	sendPackets(buffer) {
		buffer = Array.isArray(buffer) ? Buffer.concat(buffer) : buffer;
		assert(Buffer.isBuffer(buffer), 'BNet.sendPackets expects buffer');

		hex(buffer);
		return this.socket.write(buffer);
	}

	extractPackets() {
		while (this.incomingBuffer.length >= 4) {
			var buffer = this.incomingBuffer;

			if (!this.protocol.haveHeader(buffer)) {
				error('received invalid packet from battle.net (bad header constant), disconnecting');
				this.socket.end();
			}

			const len = GetLength(buffer);

			if (len < 4) {
				error('received invalid packet from battle.net (bad length), disconnecting');
				return;
			}

			if (buffer.length >= len) {
				this.incomingPackets.push(
					new CommandPacket(
						this.protocol.BNET_HEADER_CONSTANT,
						buffer[1],
						buffer.slice(0, len)
					)
				);

				this.incomingBuffer = buffer.slice(len);
			} else { // still waiting for rest of the packet
				return;
			}
		}
	}

	processPackets() {
		while (this.incomingPackets.length) {
			const packet = this.incomingPackets.pop();

			if (packet.type === this.protocol.BNET_HEADER_CONSTANT) {
				const receiver = this.protocol.receivers[packet.id];
				const handler = this.handlers[packet.id];

				(!handler) && error(`handler for packet '${packet.id}' not found`);
				(!receiver) && error(`receiver for packet '${packet.id}' not found`);

				handler && receiver && handler.call(this, receiver.call(this.protocol, packet.buffer));
			}
		}
	}

	update() {
		if (this.connecting) {
			info(`[${this.alias}] connected`);

			this.sendPackets(this.protocol.SEND_PROTOCOL_INITIALIZE_SELECTOR());
			this.sendPackets(
				this.protocol.SEND_SID_AUTH_INFO(
					this.war3version,
					this.TFT,
					this.localeID,
					this.countryAbbrev,
					this.country,
					this.language
				)
			);

			this.lastNullTime = getTime();
			this.lastOutPacketTicks = getTicks();

			this.connecting = false;
		}

		if (this.connected) {
			// the socket is connected and everything appears to be working properly

			this.waitTicks = 0;

			if (this.lastOutPacketSize < 10)
				this.waitTicks = 1300;
			else if (this.lastOutPacketSize < 30)
				this.waitTicks = 3400;
			else if (this.lastOutPacketSize < 50)
				this.waitTicks = 3600;
			else if (this.lastOutPacketSize < 100)
				this.waitTicks = 3900;
			else
				this.waitTicks = 5500;

			// add on frequency delay
			this.waitTicks += this.frequencyDelayTimes * 60;

			if (this.outPackets.length && getTicks() - this.lastOutPacketTicks >= this.waitTicks) {
				if (this.outPackets.length > 7) {
					info(`packet queue warning - there are ${this.outPackets.length} packets waiting to be sent`);
				}

				const packet = this.outPackets.shift();

				this.sendPackets(packet);

				//m_Socket->PutBytes( m_OutPackets.front( ) );
				this.lastOutPacketSize = packet.length; //m_OutPackets.front( ).size( );
				//m_OutPackets.pop( );

				// reset frequency delay (or increment it)
				if (this.frequencyDelayTimes >= 100 || getTicks() > this.lastOutPacketTicks + this.waitTicks + 500)
					this.frequencyDelayTimes = 0;
				else
					this.frequencyDelayTimes++;

				this.lastOutPacketTicks = getTicks();
			}

			if (getTime() - this.lastNullTime >= 60) {
				this.sendPackets(this.protocol.SEND_SID_NULL());
				this.lastNullTime = getTime();
			}
		}

		if (!this.connecting && !this.connected && this.firstConnect) {
			info(`[${this.alias}] connecting to server [${this.server}] on port 6112`);

			this.firstConnect = false;

			this.connect();
		}

		return this.exiting;
	}

	connect() {
		this.socket.connect(6112, this.server);
	}

	disconnect() {
		this.socket.end();
	}

	sendJoinChannel(channel) {
		if (this.loggedIn && this.inChat) {
			this.sendPackets(this.protocol.SEND_SID_JOINCHANNEL(channel));
		}
	}

	sendGetFriendsList() {
		if (this.loggedIn) {
			this.sendPackets(this.protocol.SEND_SID_FRIENDSLIST());
		}
	}

	sendGetClanList() {
		if (this.loggedIn) {
			this.sendPackets(this.protocol.SEND_SID_CLANMEMBERLIST());
		}
	}

	queueEnterChat() {
		// if( m_LoggedIn )
		// m_OutPackets.push( m_Protocol->SEND_SID_ENTERCHAT( ) );
	}

	queueChatCommand(command) {
		if (!command.length) {
			return;
		}

		if (this.loggedIn) {
			if (this.passwordHashType === 'pvpgn' && command.length > this.maxMessageLength) {
				command = command.substr(0, this.maxMessageLength);
			}

			if (command.length > 255) {
				command = command.substr(0, 255);
			}

			if (this.outPackets.length > 10) {
				info(`attempted to queue chat command [${command}] but there are too many (${this.outPackets.length}) packets queued, discarding`);
			} else {
				this.outPackets.push(this.protocol.SEND_SID_CHATCOMMAND(command));
			}
		}
	}

	queueWhisperCommand(user, command) {
		return this.queueChatCommand(`/w ${user} ${command}`);
	}

	queueGetGameList(gameName = '', numGames = 1) {
		if (this.loggedIn) {
			if (this.outPackets.length > 10) {
				info(`attempted to queue games list but there are too many (${this.outPackets.length}) packets queued, discarding`);
			} else {
				this.outPackets.push(this.protocol.SEND_SID_GETADVLISTEX(gameName, numGames));
			}
		}
	}

	queueJoinGame(gameName) {
		if (this.loggedIn) {
			this.outPackets.push(this.protocol.SEND_SID_NOTIFYJOIN(gameName));
			this.inChat = false;
			this.inGame = true;
		}
	}

	isAdmin(user) {
		return Boolean(this.admins.find((name) => name === user));
	}

	isRootAdmin(user) {
		return this.rootAdmin === user;
	}

	HANDLE_SID_PING(d) {
		debug('HANDLE_SID_PING', d);
		this.emit('SID_PING', this, d);
		this.sendPackets(this.protocol.SEND_SID_PING(d));
	}

	HANDLE_SID_AUTH_INFO(d) {
		debug('HANDLE_SID_AUTH_INFO');

		// if (BNCSUtil.HELP_SID_AUTH_CHECK(
		// 		this.TFT,
		// 		this.war3Path,
		// 		this.keyROC,
		// 		this.keyTFT,
		// 		d.valueStringFormula,
		// 		d.ix86VerFileName,
		// 		this.clientToken,
		// 		d.serverToken)) {
		//
		// }

		let {exeInfo, exeVersion} = BNCSUtil.getExeInfo(this.war3exePath, BNCSUtil.getPlatform());

		if (this.exeVersion.length) {
			exeVersion = BytesExtract(this.exeVersion, 4);

			info(`using custom exe version custom.exeversion ${JSON.stringify(exeVersion.toJSON().data)}`);
		} else {
			//exeVersion = bp.pack('<I', exeVersion);
			//exeVersion = ByteInt32()

			info(`using exe version ${JSON.stringify(exeVersion.toJSON().data)}`);
		}

		let exeVersionHash;

		if (this.exeVersionHash.length) {
			exeVersionHash = BytesExtract(this.exeVersionHash, 4);

			info(`using custom exe version hash custom.exeversionhash ${JSON.stringify(exeVersionHash.toJSON().data)}`);
		} else {
			exeVersionHash = BNCSUtil.checkRevisionFlat(
				d.valueStringFormula,
				this.war3exePath,
				this.stormdllPath,
				this.gamedllPath,
				BNCSUtil.extractMPQNumber(d.ix86VerFileName)
			);

			//exeVersionHash = bp.pack('<I', exeVersionHash);

			info(`using exe version hash ${JSON.stringify(exeVersionHash.toJSON().data)}`);
		}

		let keyInfoROC = BNCSUtil.createKeyInfo(
			this.keyROC,
			bp.unpack('<I', this.clientToken)[0],
			bp.unpack('<I', d.serverToken)[0]
		);

		let keyInfoTFT = '';

		if (this.TFT) {
			keyInfoTFT = BNCSUtil.createKeyInfo(
				this.keyTFT,
				bp.unpack('<I', this.clientToken)[0],
				bp.unpack('<I', d.serverToken)[0]
			);

			info('attempting to auth as "Warcraft III: The Frozen Throne"');
		} else {
			info('attempting to auth as "Warcraft III: Reign of Chaos"');
		}

		this.emit('SID_AUTH_INFO', this, d);
		this.sendPackets(this.protocol.SEND_SID_AUTH_CHECK(
			this.TFT,
			this.clientToken,
			exeVersion,
			exeVersionHash,
			keyInfoROC,
			keyInfoTFT,
			exeInfo,
			this.username
		));
	}

	HANDLE_SID_AUTH_CHECK(d) {
		debug('HANDLE_SID_AUTH_CHECK');

		if (d.keyState.toString('hex') !== AsHex(this.protocol.KR_GOOD)) {
			switch (d.keyState.toString('hex')) {
				case AsHex(this.protocol.KR_ROC_KEY_IN_USE):
					error(`logon failed - ROC CD key in use by user [${d.keyStateDescription}], disconnecting`);
					break;
				case AsHex(this.protocol.KR_TFT_KEY_IN_USE):
					error(`logon failed - TFT CD key in use by user [${d.keyStateDescription}], disconnecting`);
					break;
				case AsHex(this.protocol.KR_OLD_GAME_VERSION):
					error(`logon failed - game version is too old, disconnecting`);
					break;
				case AsHex(this.protocol.KR_INVALID_VERSION):
					error(`logon failed - game version is invalid, disconnecting`);
					break;
				default:
					error('logon failed - cd keys not accepted, disconnecting');
			}
		} else {
			let clientPublicKey;

			if (!this.nls) {
				this.nls = BNCSUtil.nls_init(this.username, this.password);
			}

			clientPublicKey = BNCSUtil.nls_get_A(this.nls);

			if (clientPublicKey.length !== 32) { // retry since bncsutil randomly fails
				this.nls = BNCSUtil.nls_init(this.username, this.password);
				clientPublicKey = BNCSUtil.nls_get_A(this.nls);

				assert(clientPublicKey.length === 32, 'client public key wrong length');
			}

			this.emit('SID_AUTH_CHECK', this, d);
			this.sendPackets(this.protocol.SEND_SID_AUTH_ACCOUNTLOGON(clientPublicKey, this.username));
		}
	}

	HANDLE_SID_REQUIREDWORK() {
		debug('HANDLE_SID_REQUIREDWORK');
		return null;
	}

	HANDLE_SID_AUTH_ACCOUNTLOGON(d) {
		debug('HANDLE_SID_AUTH_ACCOUNTLOGON');
		var buff;

		info(`username ${this.username} accepted`);

		if (this.passwordHashType === 'pvpgn') {
			info('using pvpgn logon type (for pvpgn servers only)');

			buff = this.protocol.SEND_SID_AUTH_ACCOUNTLOGONPROOF(
				BNCSUtil.hashPassword(this.password)
			);

		} else {
			info('using battle.net logon type (for official battle.net servers only)');

			buff = this.protocol.SEND_SID_AUTH_ACCOUNTLOGONPROOF(
				BNCSUtil.nls_get_M1(this.nls, d.serverPublicKey, d.salt)
			);
		}

		this.emit('SID_AUTH_ACCOUNTLOGON', this, d);
		this.sendPackets(buff);
	}

	HANDLE_SID_AUTH_ACCOUNTLOGONPROOF(d) {
		debug('HANDLE_SID_AUTH_ACCOUNTLOGONPROOF');

		if (!d) {
			error('Logon proof rejected.');
			return;
		}

		this.loggedIn = true;

		info(`[${this.alias}] logon successful`);

		this.emit('SID_AUTH_ACCOUNTLOGONPROOF', this, d);
		this.sendPackets([
			this.protocol.SEND_SID_NETGAMEPORT(this.hostPort),
			this.protocol.SEND_SID_ENTERCHAT(),
			this.protocol.SEND_SID_FRIENDSLIST(),
			this.protocol.SEND_SID_CLANMEMBERLIST(),
		]);

		setInterval(() => {
			this.queueGetGameList('', 20);
		}, 15000);
	}

	HANDLE_SID_NULL() {
		debug('HANDLE_SID_NULL');
		// warning: we do not respond to NULL packets with a NULL packet of our own
		// this is because PVPGN servers are programmed to respond to NULL packets so it will create a vicious cycle of useless traffic
		// official battle.net servers do not respond to NULL packets
		return;
	}

	HANDLE_SID_ENTERCHAT(d) {
		debug('HANDLE_SID_ENTERCHAT');

		if ('#' === d.toString()[0]) {
			debug('Warning: Account already logged in.');
		}

		info(`joining channel [${this.firstChannel}]`);

		this.inChat = true;

		this.emit('SID_ENTERCHAT', this, d);
		this.sendPackets(this.protocol.SEND_SID_JOINCHANNEL(this.firstChannel));
	}

	HANDLE_SID_CHATEVENT(d) {
		debug('HANDLE_SID_CHATEVENT');

		this.emit('SID_CHATEVENT', this, d);
	}

	HANDLE_SID_CLANINFO() {
		debug('HANDLE_SID_CLANINFO');
	}

	HANDLE_SID_CLANMEMBERLIST() {
		debug('HANDLE_SID_CLANMEMBERLIST');
	}

	HANDLE_SID_CLANMEMBERSTATUSCHANGE() {
		debug('HANDLE_SID_CLANMEMBERSTATUSCHANGE');
	}

	HANDLE_SID_MESSAGEBOX(d) {
		debug('HANDLE_SID_MESSAGEBOX');
	}

	HANDLE_SID_FRIENDSLIST(friends) {
		debug('HANDLE_SID_FRIENDSLIST');

		this.emit('SID_FRIENDSLIST', this, friends);
	}

	HANDLE_SID_GETADVLISTEX(d) {

	}
}