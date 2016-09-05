import net from 'net';
import bp from 'bufferpack';
import assert from 'assert';
import path from 'path';
import EventEmitter from 'events';
import {ByteArray} from './../Bytes';
import BNetProtocol, {receivers, getLength} from './BNetProtocol';
import CommandPacket from '../CommandPacket';
import BNCSUtil from './../../libbncsutil/BNCSUtil';
import {create, hex} from '../Logger';

const {debug, info, error} = create('BNet');

/**
 *
 * @param {String} key
 * @param {Number} clientToken
 * @param {Number} serverToken
 * @returns {Buffer}
 */
function createKeyInfo(key, clientToken, serverToken) {
	var info = BNCSUtil.kd_quick(key, clientToken, serverToken);
	var bytes = [
		bp.pack('<I', key.length),
		bp.pack('<I', info.product),
		bp.pack('<I', info.publicValue),
		'\x00\x00\x00\x00',
		info.hash
	];

	return ByteArray(bytes);
}

/**
 *
 * @param {String} server
 * @param {String} alias
 * @param {Number} port
 * @param {Object} options
 * @constructor
 */
class BNet extends EventEmitter {
	constructor(config) {
		super();

		this.data = Buffer.from('');
		this.incomingPackets = [];
		this.incomingBuffer = Buffer.from('');

		this.clientToken = Buffer.from('\xdc\x01\xcb\x07', 'binary');

		this.lastPacketTime = 0;
		this.packetInterval = 4.0;

		this.server = config.item('server');
		this.alias = config.item('alias');
		this.port = config.item('port', 6112);
		this.hostPort = config.item('hostPort', 6112);

		this.war3version = config.item('war3version', '26');
		this.TFT = config.item('tft', true);
		this.localeID = config.item('localeid', '1033');
		this.countryAbbrev = config.item('countryabbrev', 'USA');
		this.country = config.item('country', 'United States');
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
		this.firstChannel = config.item('firstChannel', 'The Void');
		this.passwordHashType = config.item('passwordHashType', '');

		// this.handlers[BNetProtocol.SID_CLANINVITATION] =            this.HANDLE_SID_CLANINVITATION;
		// this.handlers[BNetProtocol.SID_CLANMEMBERREMOVED] =         this.HANDLE_SID_CLANMEMBERREMOVED;
		// this.handlers[BNetProtocol.SID_FRIENDSUPDATE] =             this.HANDLE_SID_FRIENDSUPDATE;
		// this.handlers[BNetProtocol.SID_FRIENDSLIST] =               this.HANDLE_SID_FRIENDSLIST;
		// this.handlers[BNetProtocol.SID_FLOODDETECTED] =             this.HANDLE_SID_FLOODDETECTED;
		// this.handlers[BNetProtocol.SID_FRIENDSADD] =                this.HANDLE_SID_FRIENDSADD;
	}

	/**
	 * @param {Buffer|Array} buffer
	 * @param {Boolean} [immediate]
	 * @returns {*|Number}
	 */
	sendPackets(buffer, immediate) {
		buffer = Array.isArray(buffer) ? Buffer.concat(buffer) : buffer;

		if (Buffer.isBuffer(buffer)) {
			hex(buffer);
			return this.socket.write(buffer);
		} else {
			throw 'wrong send buffer given';
		}
	}

	extractPackets() {
		while (this.incomingBuffer.length >= 4) {
			var buffer = this.incomingBuffer;

			if (String.fromCharCode(buffer[0]) !== BNetProtocol.BNET_HEADER_CONSTANT) {
				error('received invalid packet from battle.net (bad header constant), disconnecting');
				this.socket.end();
			}

			const len = getLength(buffer);

			if (len < 4) {
				error('received invalid packet from battle.net (bad length), disconnecting');
				return;
			}

			if (buffer.length >= len) {
				this.incomingPackets.push(
					new CommandPacket(
						BNetProtocol.BNET_HEADER_CONSTANT,
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
		var packet;
		var receiver;
		var handler;

		while (this.incomingPackets.length) {
			packet = this.incomingPackets.pop();

			if (packet.type === BNetProtocol.BNET_HEADER_CONSTANT) {
				receiver = receivers[packet.id];
				handler = handlers[packet.id];

				if (!handler) {
					error(`handler for packet '${packet.id}' not found`)
				}

				if (!receiver) {
					error(`receiver for packet '${packet.id}' not found`)
				}

				handler && receiver && handler.call(this, receiver.call(BNetProtocol, packet.buffer));
			}
		}
	}

	onConnect = () => {
		debug('connected', this.alias, this.server, this.port);

		this.sendPackets([
			BNetProtocol.SEND_PROTOCOL_INITIALIZE_SELECTOR(),
			BNetProtocol.SEND_SID_AUTH_INFO(
				this.war3version,
				this.TFT,
				this.localeID,
				this.countryAbbrev,
				this.country
			)
		]);
	};

	onData = (buffer) => {
		debug('data');
		hex(buffer);

		this.incomingBuffer = Buffer.concat([this.incomingBuffer, buffer]);

		this.extractPackets();
		this.processPackets();
	};

	onEnd = () => {
		debug('connection end');
	};

	onError = (error) => {
		debug('error ' + error);
	};

	run(options) {
		this.socket = net.createConnection(this.port, this.server);

		this.socket.on('connect', this.onConnect);
		this.socket.on('data', this.onData);
		this.socket.on('end', this.onEnd);
		this.socket.on('error', this.onError);
		//this.socket.connect(this.port, this.server);
	}

	static HANDLE_SID_PING(d) {
		debug('HANDLE_SID_PING', d);
		this.sendPackets(BNetProtocol.SEND_SID_PING(d));
	}

	static HANDLE_SID_AUTH_INFO(d) {
		debug('HANDLE_SID_AUTH_INFO', d);

		const exe = BNCSUtil.getExeInfo(this.war3exePath, BNCSUtil.getPlatform());

		let {exeInfo, exeVersion} = exe;

		exeVersion = bp.pack('<I', exeVersion);

		let exeVersionHash = BNCSUtil.checkRevisionFlat(
			d.valueStringFormula,
			this.war3exePath,
			this.stormdllPath,
			this.gamedllPath,
			BNCSUtil.extractMPQNumber(d.ix86VerFileName)
		);

		let keyInfoROC = createKeyInfo(
			this.keyROC,
			bp.unpack('<I', this.clientToken)[0],
			bp.unpack('<I', d.serverToken)[0]
		);

		let keyInfoTFT = '';

		if (this.TFT) {
			keyInfoTFT = createKeyInfo(
				this.keyTFT,
				bp.unpack('<I', this.clientToken)[0],
				bp.unpack('<I', d.serverToken)[0]
			);

			info('attempting to auth as Warcraft III: The Frozen Throne');
		} else {
			info('attempting to auth as Warcraft III: Reign of Chaos');
		}

		this.sendPackets(BNetProtocol.SEND_SID_AUTH_CHECK(
			this.TFT,
			this.clientToken,
			exeVersion,
			bp.pack('<I', exeVersionHash),
			keyInfoROC,
			keyInfoTFT,
			exeInfo,
			'GHost.js'
		));
	}

	static HANDLE_SID_AUTH_CHECK(d) {
		debug('HANDLE_SID_AUTH_CHECK', d);

		if (d.keyState.toString() !== BNetProtocol.KR_GOOD.toString()) {
			error('CD Key or version problem. See above');
		} else {
			var clientPublicKey;

			if (!this.nls) {
				this.nls = BNCSUtil.nls_init(this.username, this.password)
			}

			clientPublicKey = BNCSUtil.nls_get_A(this.nls);

			if (clientPublicKey.length !== 32) { // retry since bncsutil randomly fails
				this.nls = BNCSUtil.nls_init(this.username, this.password);
				clientPublicKey = BNCSUtil.nls_get_A(this.nls);

				assert(clientPublicKey.length === 32, 'client public key wrong length')
			}

			this.sendPackets(BNetProtocol.SEND_SID_AUTH_ACCOUNTLOGON(clientPublicKey, this.username));
		}
	}

	static HANDLE_SID_REQUIREDWORK() {
		debug('HANDLE_SID_REQUIREDWORK');
		return;
	}

	static HANDLE_SID_AUTH_ACCOUNTLOGON(d) {
		debug('HANDLE_SID_AUTH_ACCOUNTLOGON');
		var buff;

		info(`username ${this.username} accepted`);

		if (this.passwordHashType === 'pvpgn') {
			info('using pvpgn logon type (for pvpgn servers only)');

			buff = BNetProtocol.SEND_SID_AUTH_ACCOUNTLOGONPROOF(
				BNCSUtil.hashPassword(this.password)
			);

		} else {
			info('using battle.net logon type (for official battle.net servers only)');

			buff = BNetProtocol.SEND_SID_AUTH_ACCOUNTLOGONPROOF(
				BNCSUtil.nls_get_M1(this.nls, d.serverPublicKey, d.salt)
			);
		}

		this.sendPackets(buff);
	}

	static HANDLE_SID_AUTH_ACCOUNTLOGONPROOF(d) {
		debug('HANDLE_SID_AUTH_ACCOUNTLOGONPROOF');

		if (!d) {
			error('Logon proof rejected.');
			return;
		}

		this.emit('loggedIn', this, d);

		info(`[${this.alias}] logon successful`);

		this.sendPackets([
			BNetProtocol.SEND_SID_NETGAMEPORT(this.hostPort),
			BNetProtocol.SEND_SID_ENTERCHAT(),
			BNetProtocol.SEND_SID_FRIENDSLIST(),
			BNetProtocol.SEND_SID_CLANMEMBERLIST()
		]);

		// hook.call_wait('before-handle_sid_accountlogonproof', self, d)
		// if not d:
		//     atomic_debug('Logon proof rejected.')
		//     self.socket.close()
		//     return
		// hook.call_wait('before-handle_sid_accountlogonproof', self, d)
		// #p = bnetprotocol.SEND_SID_NETGAMEPORT(self.hostPort)
		// #self.send_packet(p)
		// p = bnetprotocol.SEND_SID_ENTERCHAT()
		// self.send_packet(p)
		// hook.call_nowait('after-handle_sid_accountlogonproof', self, d)
	}

	static HANDLE_SID_NULL() {
		debug('HANDLE_SID_NULL');

		return;
	}

	static HANDLE_SID_ENTERCHAT(d) {
		debug('HANDLE_SID_ENTERCHAT');

		if ('#' === d.toString()[0]) {
			debug('Warning: Account already logged in.')
		}

		this.emit('enterChat', this, d);
		this.sendPackets(BNetProtocol.SEND_SID_JOINCHANNEL(this.firstChannel));
	}

	static HANDLE_SID_CHATEVENT(d) {
		debug('HANDLE_SID_CHATEVENT');

		this.emit('chatEvent', this, d);
	}

	static HANDLE_SID_CLANINFO() {
		debug('HANDLE_SID_CLANINFO');
	}

	static HANDLE_SID_CLANMEMBERLIST() {
		debug('HANDLE_SID_CLANMEMBERLIST');
	}

	static HANDLE_SID_CLANMEMBERSTATUSCHANGE() {
		debug('HANDLE_SID_CLANMEMBERSTATUSCHANGE');
	}

	static HANDLE_SID_MESSAGEBOX() {
		debug('HANDLE_SID_MESSAGEBOX');
	}

	static HANDLE_SID_FRIENDSLIST(d) {
		debug('HANDLE_SID_FRIENDSLIST', d);
	}
}

export const handlers = {
	[BNetProtocol.SID_PING.charCodeAt(0)]: BNet.HANDLE_SID_PING,

	[BNetProtocol.SID_AUTH_INFO.charCodeAt(0)]: BNet.HANDLE_SID_AUTH_INFO,
	[BNetProtocol.SID_AUTH_CHECK.charCodeAt(0)]: BNet.HANDLE_SID_AUTH_CHECK,
	[BNetProtocol.SID_AUTH_ACCOUNTLOGON.charCodeAt(0)]: BNet.HANDLE_SID_AUTH_ACCOUNTLOGON,
	[BNetProtocol.SID_AUTH_ACCOUNTLOGONPROOF.charCodeAt(0)]: BNet.HANDLE_SID_AUTH_ACCOUNTLOGONPROOF,
	[BNetProtocol.SID_REQUIREDWORK.charCodeAt(0)]: BNet.HANDLE_SID_REQUIREDWORK,

	[BNetProtocol.SID_NULL.charCodeAt(0)]: BNet.HANDLE_SID_NULL,
	[BNetProtocol.SID_ENTERCHAT.charCodeAt(0)]: BNet.HANDLE_SID_ENTERCHAT,
	[BNetProtocol.SID_CHATEVENT.charCodeAt(0)]: BNet.HANDLE_SID_CHATEVENT,
	[BNetProtocol.SID_CLANINFO.charCodeAt(0)]: BNet.HANDLE_SID_CLANINFO,
	[BNetProtocol.SID_CLANMEMBERLIST.charCodeAt(0)]: BNet.HANDLE_SID_CLANMEMBERLIST,
	[BNetProtocol.SID_CLANMEMBERSTATUSCHANGE.charCodeAt(0)]: BNet.HANDLE_SID_CLANMEMBERSTATUSCHANGE,
	[BNetProtocol.SID_MESSAGEBOX.charCodeAt(0)]: BNet.HANDLE_SID_MESSAGEBOX,

	[BNetProtocol.SID_CLANINVITATION.charCodeAt(0)]: BNet.HANDLE_SID_CLANINVITATION,
	[BNetProtocol.SID_CLANMEMBERREMOVED.charCodeAt(0)]: BNet.HANDLE_SID_CLANMEMBERREMOVED,
	[BNetProtocol.SID_FRIENDSUPDATE.charCodeAt(0)]: BNet.HANDLE_SID_FRIENDSUPDATE,
	[BNetProtocol.SID_FRIENDSLIST.charCodeAt(0)]: BNet.HANDLE_SID_FRIENDSLIST,
	[BNetProtocol.SID_FLOODDETECTED.charCodeAt(0)]: BNet.HANDLE_SID_FLOODDETECTED,
	[BNetProtocol.SID_FRIENDSADD.charCodeAt(0)]: BNet.HANDLE_SID_FRIENDSADD
};

export default BNet;