import net from 'net';
import hex from 'hex';
import bp from 'bufferpack';
import assert from 'assert';
import path from 'path';
import {ByteArray} from './../Bytes';
import BNetProtocol, {receivers} from './BNetProtocol';
import CommandPacket from '../CommandPacket';
import BNCSUtil from './../../libbncsutil/BNCSUtil';
import {debug, error} from '../Logger';

const defaults = {
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

	console.log('create key info', info, bytes);

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
class BNet {
	constructor(config, options) {
		this.packets = [];
		this.buffer = new Buffer('');
		this.socket = new net.Socket(options);

		this.clientToken = Buffer.from('\xdc\x01\xcb\x07', 'binary');

		this.lastPacketTime = 0;
		this.packetInterval = 4.0;

		this.server = config.item('server');
		this.alias = config.item('alias');
		this.port = config.item('port', 6112);

		this.war3version = config.item('war3version', '26');
		this.TFT = config.item('tft', true);
		this.localeId = config.item('localeid', 1033);
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
		this.firstChannel = config.item('firstchannel', 'The Void');

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

	/**
	 *
	 * @param {Buffer} buffer
	 * @returns {null}
	 */
	extractPackets(buffer) {
		var len;

		if (String.fromCharCode(buffer[0]) !== BNetProtocol.BNET_HEADER_CONSTANT) {
			error('received invalid packet from battle.net (bad header constant), disconnecting');
			this.socket.end();
		}

		len = BNetProtocol.getLength(buffer);

		if (len < 4) {
			error('received invalid packet from battle.net (bad length), disconnecting');
			this.socket.end();
		}

		if (buffer.length >= len) {
			this.packets.push(new CommandPacket(BNetProtocol.BNET_HEADER_CONSTANT, buffer[1], buffer));
			this.buffer = buffer.slice(len);
		} else { // still waiting for rest of the packet
			return null;
		}
	}

	processPackets() {
		var packet;
		var receiver;
		var handler;

		while (this.packets.length) {
			packet = this.packets.pop();

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
				defaults.war3version,
				defaults.tft,
				defaults.localeID,
				defaults.countryAbbrev,
				defaults.country
			)
		]);
	};

	onData = (buffer) => {
		debug('data');
		hex(buffer);

		this.extractPackets(buffer);
		this.processPackets();
	};

	onEnd = () => {
		debug('connection end');
	};

	onError = (error) => {
		debug('error ' + error);
	};

	run() {
		this.socket.on('connect', this.onConnect);
		this.socket.on('data', this.onData);
		this.socket.on('end', this.onEnd);
		this.socket.on('error', this.onError);
		this.socket.connect(this.port, this.server);
	}

	static HANDLE_SID_PING(d) {
		debug('HANDLE_SID_PING', d);
		this.sendPackets(BNetProtocol.SEND_SID_PING(d));
	}

	static HANDLE_SID_AUTH_INFO(d) {
		debug('HANDLE_SID_AUTH_INFO', d);

		console.log(this.war3exePath);

		const info = BNCSUtil.getExeInfo(this.war3exePath, BNCSUtil.getPlatform());
		console.log('exeInfo, exeVersion', info);

		let {exeInfo, exeVersion} = info;

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

		//
		// #atomic_debug('In HANDLE_SID_AUTH_INFO')
		// #exeInfo, exeVersion = tpool.execute(bncsutil.getExeInfo, self.war3exePath, bncsutil.PLATFORM_X86)
		// exeInfo, exeVersion = bncsutil.getExeInfo(self.war3exePath, bncsutil.PLATFORM_X86)
		// exeVersion = pack('<I', exeVersion)
		// #exeVersionHash = tpool.execute(bncsutil.checkRevisionFlat, bytes(d.valueStringFormula), self.war3exePath, self.stormdllPath, self.gamedllPath, bncsutil.extractMPQNumber(bytes(d.ix86VerFileName)))
		// exeVersionHash = bncsutil.checkRevisionFlat(bytes(d.valueStringFormula), self.war3exePath, self.stormdllPath, self.gamedllPath, bncsutil.extractMPQNumber(bytes(d.ix86VerFileName)))
		// keyInfoRoc = ''
		// keyInfoRoc = create_key_info(self.keyRoc, unpack('<I', self.clientToken)[0], unpack('<I', bytes(d.serverToken))[0])
		// if len(keyInfoRoc) != 36:
		//     bncsutil.init(force=True)
		//     keyInfoRoc = create_key_info(self.keyRoc, unpack('<I', self.clientToken)[0], unpack('<I', bytes(d.serverToken))[0])
		// assert len(keyInfoRoc) == 36
		// keyInfoTft = ''
		// if self.tft:
		//     keyInfoTft = create_key_info(self.keyTft, unpack('<I', self.clientToken)[0], unpack('<I', bytes(d.serverToken))[0])
		//     if len(keyInfoTft) != 36:
		//         bncsutil.init(force=True)
		//         keyInfoTft = create_key_info(self.keyTft, unpack('<I', self.clientToken)[0], unpack('<I', bytes(d.serverToken))[0])
		//     assert len(keyInfoTft) == 36
		// p = bnetprotocol.SEND_SID_AUTH_CHECK(self.tft, self.clientToken, exeVersion, pack('<I', exeVersionHash), keyInfoRoc, keyInfoTft, exeInfo, 'GHost')
		// self.send_packet(p)

	}

	static HANDLE_SID_AUTH_CHECK() {
		debug('HANDLE_SID_AUTH_CHECK');
	}

	static HANDLE_SID_REQUIREDWORK() {
		debug('HANDLE_SID_REQUIREDWORK');
	}

	static HANDLE_SID_AUTH_ACCOUNTLOGON() {
		debug('HANDLE_SID_AUTH_ACCOUNTLOGON');
	}

	static HANDLE_SID_AUTH_ACCOUNTLOGONPROOF() {
		debug('HANDLE_SID_AUTH_ACCOUNTLOGONPROOF');
	}

	static HANDLE_SID_NULL() {
		debug('HANDLE_SID_NULL');
	}

	static HANDLE_SID_ENTERCHAT() {
		debug('HANDLE_SID_ENTERCHAT');
	}

	static HANDLE_SID_CHATEVENT() {
		debug('HANDLE_SID_CHATEVENT');
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
}

export const handlers = {
	[BNetProtocol.SID_PING.charCodeAt(0)]: BNet.HANDLE_SID_PING,
	[BNetProtocol.SID_AUTH_INFO.charCodeAt(0)]: BNet.HANDLE_SID_AUTH_INFO,
	[BNetProtocol.SID_AUTH_CHECK.charCodeAt(0)]: BNet.HANDLE_SID_AUTH_CHECK,
	[BNetProtocol.SID_REQUIREDWORK.charCodeAt(0)]: BNet.HANDLE_SID_REQUIREDWORK,
	[BNetProtocol.SID_AUTH_ACCOUNTLOGON.charCodeAt(0)]: BNet.HANDLE_SID_AUTH_ACCOUNTLOGON,
	[BNetProtocol.SID_AUTH_ACCOUNTLOGONPROOF.charCodeAt(0)]: BNet.HANDLE_SID_AUTH_ACCOUNTLOGONPROOF,
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