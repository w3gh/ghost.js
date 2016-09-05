import bp from 'bufferpack';
import hex from 'hex';
import assert from 'assert';
import {ByteArray, AssignLength} from './../Bytes';
import Protocol from './../Protocol';
import chalk from 'chalk';

import {create} from '../Logger';

const {debug, info, error} = create('BNetProtocol');
/**
 * Converts hex string as BNetProtocol.EID_SHOWUSER to js hex number
 * @param hexString
 * @returns {string}
 */
function asHex(hexString) {
	return Buffer.from(hexString).toString('hex');
}

function hexCompare(hexString, buff) {
	return asHex(hexString) === buff.toString('hex');
}

function printChat(id, username, message) {
	switch (id) {
		case 'ERROR':
			console.log(chalk.red(message));
			break;
		case 'INFO':
			console.log(chalk.blue(message));
			break;
		default:
			console.log(`[${username}] ${message}`);
	}
}

/**
 *
 * @param {Buffer} buff
 * @returns {*}
 */
export function getLength(buff) {
	//buff.toString('hex', 2, 4)
	var d = buff.slice(2, 4);
	var val = bp.unpack('<H', d);

	return Number(val.join(''));
}

export function validateLength(buff) {
	return getLength(buff) === buff.length;
}

class BNetProtocol extends Protocol {

	static BNET_HEADER_CONSTANT = '\xff';

	static SID_AUTH_INFO = '\x50';
	static SID_PING = '\x25';
	static SID_AUTH_CHECK = '\x51';
	static SID_REQUIREDWORK = '\x4c';
	static SID_AUTH_ACCOUNTLOGON = '\x53';
	static SID_AUTH_ACCOUNTLOGONPROOF = '\x54';
	static SID_NULL = '\x00';
	static SID_NETGAMEPORT = '\x45';
	static SID_ENTERCHAT = '\x0a';
	static SID_JOINCHANNEL = '\x0c';
	static SID_CHATEVENT = '\x0f';
	static SID_CHATCOMMAND = '\x0e';
	static SID_CLANINFO = '\x75';
	static SID_CLANMEMBERLIST = '\x7d';
	static SID_CLANMEMBERSTATUSCHANGE = '\x7f';
	static SID_MESSAGEBOX = '\x19';
	static SID_CLANINVITATION = '\x77';
	static SID_CLANMEMBERREMOVED = '\x7e';
	static SID_FRIENDSUPDATE = '\x66';
	static SID_FRIENDSLIST = '\x65';
	static SID_FLOODDETECTED = '\x13';
	static SID_FRIENDSADD = '\x67';

	static KR_GOOD = '\x00\x00\x00\x00';
	static KR_OLD_GAME_VERSION = '\x00\x01\x00\x00';
	static KR_INVALID_VERSION = '\x01\x01\x00\x00';
	static KR_ROC_KEY_IN_USE = '\x01\x02\x00\x00';
	static KR_TFT_KEY_IN_USE = '\x11\x02\x00\x00';

	static NULL = '\x00';
	static NULL_2 = '\x00\x00';
	static NULL_3 = '\x00\x00\x00';
	static NULL_4 = '\x00\x00\x00\x00';

	static EID_SHOWUSER = '\x01\x00\x00\x00';
	static EID_JOIN = '\x02\x00\x00\x00';
	static EID_LEAVE = '\x03\x00\x00\x00';
	static EID_WHISPER = '\x04\x00\x00\x00';
	static EID_TALK = '\x05\x00\x00\x00';
	static EID_BROADCAST = '\x06\x00\x00\x00';
	static EID_CHANNEL = '\x07\x00\x00\x00';
	static EID_USERFLAGS = '\x09\x00\x00\x00';
	static EID_WHISPERSENT = '\x0a\x00\x00\x00';
	static EID_CHANNELFULL = '\x0d\x00\x00\x00';
	static EID_CHANNELDOESNOTEXIST = '\x0e\x00\x00\x00';
	static EID_CHANNELRESTRICTED = '\x0f\x00\x00\x00';
	static EID_INFO = '\x12\x00\x00\x00';
	static EID_ERROR = '\x13\x00\x00\x00';
	static EID_EMOTE = '\x17\x00\x00\x00';

	static CLANRANK_INITIATE = 0;
	static CLANRANK_PEON = 1;
	static CLANRANK_GRUNT = 2;
	static CLANRANK_SHAMAN = 3;
	static CLANRANK_CHIEFTAN = 4;

	// Bitfield
	static FRIENDSTATUS_MUTUAL = 1;
	static FRIENDSTATUS_DND = 2;
	static FRIENDSTATUS_AWAY = 4;

	// Value
	static FRIENDLOCATION_OFFLINE = 0;
	static FRIENDLOCATION_NOTCHAT = 1;
	static FRIENDLOCATION_CHAT = 2;
	static FRIENDLOCATION_PUB = 3;
	static FRIENDLOCATION_PRIVHIDE = 4;
	static FRIENDLOCATION_PRIVSHOW = 5;

	constructor() {
		super();
	}

	/**
	 *
	 * @param {Buffer} buff
	 * @returns {*}
	 */
	static getLength(buff) {
		//buff.toString('hex', 2, 4)
		var d = buff.slice(2, 4);
		var val = bp.unpack('<H', d);

		return Number(val.join(''));
	}

	static validateLength(buff) {
		return getLength(buff) === buff.length;
	}

	static SEND_SID_PING(payload) {
		debug('SEND_SID_PING');
		return AssignLength(ByteArray([
			this.BNET_HEADER_CONSTANT,
			this.SID_PING,
			this.NULL_2, // for length
			payload
		]));
	}

	static SEND_PROTOCOL_INITIALIZE_SELECTOR() {
		debug('SEND_PROTOCOL_INITIALIZE_SELECTOR');

		return Buffer.from('\x01', 'binary');
	}

	static SEND_SID_AUTH_INFO(ver, tft, localeID, countryAbbrev, country) {
		debug('SEND_SID_AUTH_INFO');

		var protocolID = this.NULL_4;
		var platformID = '68XI'; //[54, 56, 88, 73]; // "IX86"
		var productIdROC = '3RAW'; //[51, 82, 65, 87]; // "WAR3"
		var productIdTFT = 'XP3W'; //[80, 88, 51, 87]; // "W3XP"
		var version = [String(ver), 0, 0, 0];
		var language = 'SUne'; //[83, 85, 110, 101]; // "enUS"
		var localIP = '\x7f\x00\x00\x01'; //[127, 0, 0, 1];
		var timeZoneBias = '\x2c\x01\x00\x00'; //[44, 1, 0, 0];

		var bytes = [
			this.BNET_HEADER_CONSTANT,
			this.SID_AUTH_INFO,
			this.NULL_2, //length
			protocolID,
			platformID,
			tft ? productIdTFT : productIdROC,
			version,
			language,
			localIP,
			timeZoneBias,
			bp.pack('<I', localeID), // locale 3081 (en-au)
			bp.pack('<I', localeID),
			String(countryAbbrev),
			this.NULL,
			String(country),
			this.NULL
		];

		return AssignLength(ByteArray(bytes));
	}

	static SEND_SID_AUTH_CHECK(tft, clientToken, exeVersion, exeVersionHash, keyInfoRoc, keyInfoTft, exeInfo, keyOwnerName) {
		var numKeys = (tft) ? 2 : 1;

		// p = bytearray()
		// p.append(BNET_HEADER_CONSTANT)
		// p.append(SID_AUTH_CHECK)
		// p.extend(NULL_2) # length
		// p.extend(clientToken)
		// p.extend(exeVersion)
		// p.extend(exeVersionHash)
		// numKeys = 2 if tft else 1
		// p.append(numKeys); p.extend(NULL_3)
		// p.extend(NULL_4) # boolean Using Spawn (32 bit)
		// p.extend(keyInfoRoc)
		// if tft:
		//     p.extend(keyInfoTft)
		// p.extend(exeInfo); p.append(NULL)
		// p.extend(keyOwnerName); p.append(NULL)
		//
		// assign_length(p)
		// return p

		var bytes = [
			this.BNET_HEADER_CONSTANT,
			this.SID_AUTH_CHECK,
			this.NULL_2, //length
			clientToken,
			exeVersion,
			exeVersionHash,
			[numKeys, 0, 0, 0],
			this.NULL_4,
			keyInfoRoc
		];

		if (tft) {
			bytes.push(keyInfoTft);
		}

		bytes = bytes.concat([
			exeInfo,
			this.NULL,
			keyOwnerName,
			this.NULL
		]);

		return AssignLength(ByteArray(bytes));
	}

	static SEND_SID_AUTH_ACCOUNTLOGON(clientPublicKey, accountName) {
		assert(clientPublicKey.length === 32, 'public key length error');

		info('cd keys accepted');

		var bytes = [
			this.BNET_HEADER_CONSTANT,
			this.SID_AUTH_ACCOUNTLOGON,
			this.NULL_2, //length
			clientPublicKey,
			accountName,
			this.NULL
		];

		return AssignLength(ByteArray(bytes));
	}

	static SEND_SID_AUTH_ACCOUNTLOGONPROOF(M1) {
		assert(M1.length === 20, 'password length error');

		var bytes = [
			this.BNET_HEADER_CONSTANT,
			this.SID_AUTH_ACCOUNTLOGONPROOF,
			this.NULL_2, //length
			M1
		];

		return AssignLength(ByteArray(bytes));
	}

	static SEND_SID_NETGAMEPORT(serverPort) {
		var bytes = [
			this.BNET_HEADER_CONSTANT,
			this.SID_NETGAMEPORT,
			this.NULL_2, //length
			bp.pack('<H', serverPort)
		];

		return AssignLength(ByteArray(bytes));
	}

	static SEND_SID_ENTERCHAT() {
		var bytes = [
			this.BNET_HEADER_CONSTANT,
			this.SID_ENTERCHAT,
			this.NULL_2, //length
			this.NULL, //account name
			this.NULL //stat string
		];

		return AssignLength(ByteArray(bytes));
	}

	static SEND_SID_FRIENDSLIST() {
		var bytes = [
			this.BNET_HEADER_CONSTANT,
			this.SID_FRIENDSLIST,
			this.NULL_2, //length
		];

		return AssignLength(ByteArray(bytes));
	}

	static SEND_SID_CLANMEMBERLIST() {
		const cookie = this.NULL_4;

		var bytes = [
			this.BNET_HEADER_CONSTANT,
			this.SID_CLANMEMBERLIST,
			this.NULL_2, //length
			cookie
		];

		return AssignLength(ByteArray(bytes));
	}

	static SEND_SID_JOINCHANNEL(channel) {
		const noCreateJoin = '\x02\x00\x00\x00';
		const firstJoin = '\x01\x00\x00\x00';

		var bytes = [
			this.BNET_HEADER_CONSTANT,
			this.SID_JOINCHANNEL,
			this.NULL_2,
			channel.length > 0 ? noCreateJoin : firstJoin,
			channel,
			this.NULL
		];

		return AssignLength(ByteArray(bytes));
	}

	static RECEIVE_SID_NULL(buff) {
		debug('RECEIVE_SID_NULL');

		return validateLength(buff);
	}

	static RECEIVE_SID_GETADVLISTEX(buff) {
		debug('RECEIVE_SID_GETADVLISTEX');
	}

	static RECEIVE_SID_AUTH_INFO(buff) {
		debug('RECEIVE_SID_AUTH_INFO');
		assert(validateLength(buff) && buff.length >= 25);
		// 2 bytes					-> Header
		// 2 bytes					-> Length
		// 4 bytes					-> LogonType
		// 4 bytes					-> ServerToken
		// 4 bytes					-> ???
		// 8 bytes					-> MPQFileTime
		// null terminated string	-> IX86VerFileName
		// null terminated string	-> ValueStringFormula

		const logonType = buff.slice(4, 8); // p[4:8]
		const serverToken = buff.slice(8, 12); // p[8:12]
		const mpqFileTime = buff.slice(16, 24); // p[16:24]
		const ix86VerFileName = buff.slice(24).toString().split(BNetProtocol.NULL, 1)[0]; // p[24:].split(NULL, 1)[0]
		const valueStringFormula = buff.slice(25 + ix86VerFileName.length).toString().split(BNetProtocol.NULL, 1)[0]; // p[25 + len(ix86VerFileName):].split(this.NULL, 1)[0]

		return {
			logonType,
			serverToken,
			mpqFileTime,
			ix86VerFileName,
			valueStringFormula
		};
	};

	static RECEIVE_SID_PING(buff) {
		debug('RECEIVE_SID_PING');
		assert(buff.length >= 8);
		return buff.slice(4, 8); // bytes(p[4:8])
	};

	static RECEIVE_SID_AUTH_CHECK(buff) {
		debug('RECEIVE_SID_AUTH_CHECK');
		assert(validateLength(buff) && buff.length >= 9);
		// 2 bytes					-> Header
		// 2 bytes					-> Length
		// 4 bytes					-> KeyState
		// null terminated string	-> KeyStateDescription
		const keyState = buff.slice(4, 8);
		const keyStateDescription = buff.slice(8).toString().split(BNetProtocol.NULL, 1)[0];

		return {keyState, keyStateDescription};
	};

	static RECEIVE_SID_REQUIREDWORK(buff) {
		debug('RECEIVE_SID_REQUIREDWORK');

		return validateLength(buff);
	}

	static RECEIVE_SID_AUTH_ACCOUNTLOGON(buff) {
		assert(validateLength(buff) && buff.length >= 8);

		const status = buff.slice(4, 8);

		if (!(status.toString() === BNetProtocol.NULL_4.toString() && buff.length >= 72)) {
			error('buffer status is null');

			return false;
		}

		const salt = buff.slice(8, 40);
		const serverPublicKey = buff.slice(40, 72);

		return {status, salt, serverPublicKey};
	}

	static RECEIVE_SID_AUTH_ACCOUNTLOGONPROOF(buff) {
		debug('RECEIVE_SID_AUTH_ACCOUNTLOGONPROOF');

		assert(validateLength(buff) && buff.length >= 8);

		const statusExpected = '\x0e000000';

		const status = buff.slice(4, 8);

		return (status.toString() === BNetProtocol.NULL_4.toString()
			|| status.toString() === statusExpected.toString()
		);

		// assert (validate_length(p) and len(p) >= 8)
		// status = bytes(p[4:8])
		// return (status == NULL_4 or status == b'\x0e000000')
	}

	static RECEIVE_SID_ENTERCHAT(buff) {
		debug('RECEIVE_SID_ENTERCHAT');
		assert(validateLength(buff) && buff.length >= 5);

		return buff.slice(4);
	}

	static RECEIVE_SID_CHATEVENT(buff) {
		debug('RECEIVE_SID_CHATEVENT');

		assert(validateLength(buff) && buff.length >= 29);

		// 2 bytes					-> Header
		// 2 bytes					-> Length
		// 4 bytes					-> EventID
		// 4 bytes					-> ???
		// 4 bytes					-> Ping
		// 12 bytes					-> ???
		// null terminated string	-> User
		// null terminated string	-> Message

		const event = buff.slice(4, 8);
		const ping = bp.unpack('<I', buff.slice(12, 16)).join('');
		const user = buff.slice(28).toString().split(BNetProtocol.NULL, 1)[0];
		const message = buff.slice(29 + user.length).toString().split(BNetProtocol.NULL, 1)[0];

		var info = {
			event: BNetProtocol.CHATEVENT_ID(event),
			ping,
			user,
			message
		};

		printChat(info.event, info.user, info.message);

		return info;
	}

	/**
	 *
	 * @param {Buffer} eventBuff
	 * @returns {*}
	 * @constructor
	 */
	static CHATEVENT_ID(eventBuff) {
		switch (eventBuff.toString('hex')) {
			case asHex(BNetProtocol.EID_SHOWUSER):
				return 'SHOWUSER';
			case asHex(BNetProtocol.EID_JOIN):
				return 'JOIN';
			case asHex(BNetProtocol.EID_LEAVE):
				return 'LEAVE';
			case asHex(BNetProtocol.EID_WHISPER):
				return 'WHISPER';
			case asHex(BNetProtocol.EID_TALK):
				return 'TALK';
			case asHex(BNetProtocol.EID_BROADCAST):
				return 'BROADCAST';
			case asHex(BNetProtocol.EID_CHANNEL):
				return 'CHANNEL';
			case asHex(BNetProtocol.EID_USERFLAGS):
				return 'USERFLAGS';
			case asHex(BNetProtocol.EID_WHISPERSENT):
				return 'WHISPERSENT';
			case asHex(BNetProtocol.EID_CHANNELFULL):
				return 'CHANNELFULL';
			case asHex(BNetProtocol.EID_CHANNELDOESNOTEXIST):
				return 'CHANNELDOESNOTEXIST';
			case asHex(BNetProtocol.EID_CHANNELRESTRICTED):
				return 'CHANNELRESTRICTED';
			case asHex(BNetProtocol.EID_INFO):
				return 'INFO';
			case asHex(BNetProtocol.EID_ERROR):
				return 'ERROR';
			case asHex(BNetProtocol.EID_EMOTE):
				return 'EMOTE';
		}
	}

	static RECEIVE_SID_CHECKAD(buff) {
		debug('RECEIVE_SID_CHECKAD');
	}

	static RECEIVE_SID_STARTADVEX3(buff) {
		debug('RECEIVE_SID_STARTADVEX3');
	}

	static RECEIVE_SID_WARDEN(buff) {
		debug('RECEIVE_SID_WARDEN');
	}

	static RECEIVE_SID_FRIENDSLIST(buff) {
		debug('RECEIVE_SID_FRIENDSLIST');
	}

	static RECEIVE_SID_CLANINFO(buff) {
		debug('RECEIVE_SID_CLANINFO');
	}
}

export const receivers = {
	[BNetProtocol.SID_AUTH_INFO.charCodeAt(0)]: BNetProtocol.RECEIVE_SID_AUTH_INFO,
	[BNetProtocol.SID_AUTH_CHECK.charCodeAt(0)]: BNetProtocol.RECEIVE_SID_AUTH_CHECK,
	[BNetProtocol.SID_PING.charCodeAt(0)]: BNetProtocol.RECEIVE_SID_PING,
	[BNetProtocol.SID_REQUIREDWORK.charCodeAt(0)]: BNetProtocol.RECEIVE_SID_REQUIREDWORK,
	[BNetProtocol.SID_AUTH_ACCOUNTLOGON.charCodeAt(0)]: BNetProtocol.RECEIVE_SID_AUTH_ACCOUNTLOGON,
	[BNetProtocol.SID_AUTH_ACCOUNTLOGONPROOF.charCodeAt(0)]: BNetProtocol.RECEIVE_SID_AUTH_ACCOUNTLOGONPROOF,
	[BNetProtocol.SID_NULL.charCodeAt(0)]: BNetProtocol.RECEIVE_SID_NULL,
	[BNetProtocol.SID_ENTERCHAT.charCodeAt(0)]: BNetProtocol.RECEIVE_SID_ENTERCHAT,
	[BNetProtocol.SID_CHATEVENT.charCodeAt(0)]: BNetProtocol.RECEIVE_SID_CHATEVENT,
	[BNetProtocol.SID_CLANINFO.charCodeAt(0)]: BNetProtocol.RECEIVE_SID_CLANINFO,
	[BNetProtocol.SID_FRIENDSLIST.charCodeAt(0)]: BNetProtocol.RECEIVE_SID_FRIENDSLIST
};

export default BNetProtocol;
