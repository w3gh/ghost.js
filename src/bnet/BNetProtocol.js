import log from './../log';
import bp from 'bufferpack';
import hex from 'hex';
import assert from 'assert';
import {ByteArray} from './../Bytes';
import Protocol from './../Protocol';

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

	static receivers = {};

	static assignLength(buff) {
		var len = buff.length;
		// l = len(p)
		//   #p[2] = l % 256
		//   #p[3] = l / 256
		//   p[2:4] = pack('<H', l)
		// arr.splice(2, 1, l.toString(16));
		buff.write(len.toString(16), 2);

		return buff;
	}

	/**
	 *
	 * @param {Buffer} buff
	 * @returns {*}
	 */
	static getLength(buff) {
		console.log('getLength', buff.toString('hex', 2, 4));
		return buff.toString('hex', 2, 4);
	}

	validateLength(buff) {
		return this.getLength(buff) === buff.length;
	}

	SEND_SID_PING(payload) {
		var buff = new Buffer([this.BNET_HEADER_CONSTANT, this.SID_PING, this.NULL_2, String(payload)]);

		buff = this.assignLength(buff);

		log('SEND_SID_PING');
		hex(buff);

		return buff;
	}

	static SEND_PROTOCOL_INITIALIZE_SELECTOR() {
		log('SEND_PROTOCOL_INITIALIZE_SELECTOR');

		return new Buffer('\x01');
	}

	static SEND_SID_AUTH_INFO(ver, tft, localeID, countryAbbrev, country) {
		var protocolID = this.NULL_4;
		var platformID = [54, 56, 88, 73]; // "IX86"
		var productIdROC = [51, 82, 65, 87]; // "WAR3"
		var productIdTFT = [80, 88, 51, 87]; // "W3XP"
		var version = [String(ver), 0, 0, 0];
		var language = [83, 85, 110, 101]; // "enUS"
		var localIP = [127, 0, 0, 1];
		var timeZoneBias = [44, 1, 0, 0];

		var bytes = [
			this.BNET_HEADER_CONSTANT,
			this.SID_AUTH_INFO,
			0,
			0,
			protocolID,
			platformID
		];

		if (tft) {
			bytes.push(productIdTFT);
		} else {
			bytes.push(productIdROC);
		}

		bytes = bytes.concat([
			version,
			language,
			localIP,
			timeZoneBias,
			String(localeID), // locale 3081 (en-au)
			localeID,
			countryAbbrev,
			this.NULL,
			country,
			this.NULL
		]);

		var buff = this.assignLength(Buffer.from(bytes));

		log('SEND_SID_AUTH_INFO');
		hex(buff);
		return buff;
	}

	/**
	 *
	 * @param {Boolean} tft
	 * @param {String} clientToken
	 * @param {String} exeVersion
	 * @param {String} exeVersionHash
	 * @param {String} keyInfoRoc
	 * @param {String} keyInfoTft
	 * @param {String} exeInfo
	 * @param {String} keyOwnerName
	 * @returns {Buffer}
	 */
	static SEND_SID_AUTH_CHECK(tft, clientToken, exeVersion, exeVersionHash, keyInfoRoc, keyInfoTft, exeInfo, keyOwnerName) {
		var numKeys = (tft) ? 2 : 1;

		var bytes = [
			this.BNET_HEADER_CONSTANT,
			this.SID_AUTH_CHECK,
			this.NULL_2,
			clientToken,
			exeVersion,
			exeVersionHash,
			numKeys,
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

		return this.assignLength(ByteArray(bytes));
	}

	RECEIVE_SID_AUTH_INFO(buff) {
		// 2 bytes					-> Header
		// 2 bytes					-> Length
		// 4 bytes					-> LogonType
		// 4 bytes					-> ServerToken
		// 4 bytes					-> ???
		// 8 bytes					-> MPQFileTime
		// null terminated string	-> IX86VerFileName
		// null terminated string	-> ValueStringFormula

		var sidAuthInfo = {};

		if (this.validateLength(buff) && buff.length >= 25) {
			var logonType = buff.slice(4, 8); // p[4:8]
			var serverToken = buff.slice(8, 12); // p[8:12]
			var mpqFileTime = buff.slice(16, 24); // p[16:24]
			var ix86VerFileName = buff.slice(24).toString().split(this.NULL, 1)[0]; // p[24:].split(NULL, 1)[0]
			var valueStringFormula = buff.slice(25 + ix86VerFileName.length).toString().split(this.NULL, 1)[0]; // p[25 + len(ix86VerFileName):].split(this.NULL, 1)[0]

			sidAuthInfo = {
				logonType: logonType,
				serverToken: serverToken,
				mpqFileTime: mpqFileTime,
				ix86VerFileName: ix86VerFileName,
				valueStringFormula: valueStringFormula
			};

			console.log('RECEIVE_SID_AUTH_INFO', sidAuthInfo);
		}
		return sidAuthInfo;
	}

	RECEIVE_SID_PING(buf) {
		assert(buf.length >= 8);
		return buf.slice(4, 8); // bytes(p[4:8])
	}

	RECEIVE_SID_AUTH_CHECK(buff) {
		// 2 bytes					-> Header
		// 2 bytes					-> Length
		// 4 bytes					-> KeyState
		// null terminated string	-> KeyStateDescription
		if (this.validateLength(buff) && buff.length >= 9) {
			var keyState = buff.slice(4, 8);
			var keyStateDescription = buff.slice(8).toString().split(this.NULL, 1)[0];

			if (keyState === this.KR_GOOD) {
				return true;
			}
		}

		return false;
	}

	RECEIVE_SID_REQUIREDWORK() {
	}

	RECEIVE_SID_AUTH_ACCOUNTLOGON() {
	}

	RECEIVE_SID_AUTH_ACCOUNTLOGONPROOF() {
	}

	RECEIVE_SID_NULL() {
	}

	RECEIVE_SID_ENTERCHAT() {
	}

	RECEIVE_SID_CHATEVENT() {
	}

	RECEIVE_SID_CLANINFO() {
	}
}

BNetProtocol.receivers[BNetProtocol.SID_AUTH_INFO] = BNetProtocol.RECEIVE_SID_AUTH_INFO;
BNetProtocol.receivers[BNetProtocol.SID_AUTH_CHECK] = BNetProtocol.RECEIVE_SID_AUTH_CHECK;
BNetProtocol.receivers[BNetProtocol.SID_PING] = BNetProtocol.RECEIVE_SID_PING;
BNetProtocol.receivers[BNetProtocol.SID_REQUIREDWORK] = BNetProtocol.RECEIVE_SID_REQUIREDWORK;
BNetProtocol.receivers[BNetProtocol.SID_AUTH_ACCOUNTLOGON] = BNetProtocol.RECEIVE_SID_AUTH_ACCOUNTLOGON;
BNetProtocol.receivers[BNetProtocol.SID_AUTH_ACCOUNTLOGONPROOF] = BNetProtocol.RECEIVE_SID_AUTH_ACCOUNTLOGONPROOF;
BNetProtocol.receivers[BNetProtocol.SID_NULL] = BNetProtocol.RECEIVE_SID_NULL;
BNetProtocol.receivers[BNetProtocol.SID_ENTERCHAT] = BNetProtocol.RECEIVE_SID_ENTERCHAT;
BNetProtocol.receivers[BNetProtocol.SID_CHATEVENT] = BNetProtocol.RECEIVE_SID_CHATEVENT;
BNetProtocol.receivers[BNetProtocol.SID_CLANINFO] = BNetProtocol.RECEIVE_SID_CLANINFO;

module.exports = BNetProtocol;
