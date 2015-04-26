'use strict';

var assert = require('assert');
var hex = require('hex');
var bufferpack = require('bufferpack');
var pack = bufferpack.pack.bind(bufferpack);
var _ = require('lodash');
var log = require('./../log');
var Bytes = require('./../Bytes');

function BNetProtocol() {
}

_.extend(BNetProtocol, {
	BNET_HEADER_CONSTANT: '\xff',

	SID_AUTH_INFO: '\x50',
	SID_PING: '\x25',
	SID_AUTH_CHECK: '\x51',
	SID_REQUIREDWORK: '\x4c',
	SID_AUTH_ACCOUNTLOGON: '\x53',
	SID_AUTH_ACCOUNTLOGONPROOF: '\x54',
	SID_NULL: '\x00',
	SID_NETGAMEPORT: '\x45',
	SID_ENTERCHAT: '\x0a',
	SID_JOINCHANNEL: '\x0c',
	SID_CHATEVENT: '\x0f',
	SID_CHATCOMMAND: '\x0e',
	SID_CLANINFO: '\x75',
	SID_CLANMEMBERLIST: '\x7d',
	SID_CLANMEMBERSTATUSCHANGE: '\x7f',
	SID_MESSAGEBOX: '\x19',
	SID_CLANINVITATION: '\x77',
	SID_CLANMEMBERREMOVED: '\x7e',
	SID_FRIENDSUPDATE: '\x66',
	SID_FRIENDSLIST: '\x65',
	SID_FLOODDETECTED: '\x13',
	SID_FRIENDSADD: '\x67',

	KR_GOOD: '\x00\x00\x00\x00',
	KR_OLD_GAME_VERSION: '\x00\x01\x00\x00',
	KR_INVALID_VERSION: '\x01\x01\x00\x00',
	KR_ROC_KEY_IN_USE: '\x01\x02\x00\x00',
	KR_TFT_KEY_IN_USE: '\x11\x02\x00\x00',

	NULL: '\x00',
	NULL_2: '\x00\x00',
	NULL_3: '\x00\x00\x00',
	NULL_4: '\x00\x00\x00\x00',

	EID_SHOWUSER: '\x01\x00\x00\x00',
	EID_JOIN: '\x02\x00\x00\x00',
	EID_LEAVE: '\x03\x00\x00\x00',
	EID_WHISPER: '\x04\x00\x00\x00',
	EID_TALK: '\x05\x00\x00\x00',
	EID_BROADCAST: '\x06\x00\x00\x00',
	EID_CHANNEL: '\x07\x00\x00\x00',
	EID_USERFLAGS: '\x09\x00\x00\x00',
	EID_WHISPERSENT: '\x0a\x00\x00\x00',
	EID_CHANNELFULL: '\x0d\x00\x00\x00',
	EID_CHANNELDOESNOTEXIST: '\x0e\x00\x00\x00',
	EID_CHANNELRESTRICTED: '\x0f\x00\x00\x00',
	EID_INFO: '\x12\x00\x00\x00',
	EID_ERROR: '\x13\x00\x00\x00',
	EID_EMOTE: '\x17\x00\x00\x00',

	CLANRANK_INITIATE: 0,
	CLANRANK_PEON: 1,
	CLANRANK_GRUNT: 2,
	CLANRANK_SHAMAN: 3,
	CLANRANK_CHIEFTAN: 4,

	// Bitfield
	FRIENDSTATUS_MUTUAL: 1,
	FRIENDSTATUS_DND: 2,
	FRIENDSTATUS_AWAY: 4,

	// Value
	FRIENDLOCATION_OFFLINE: 0,
	FRIENDLOCATION_NOTCHAT: 1,
	FRIENDLOCATION_CHAT: 2,
	FRIENDLOCATION_PUB: 3,
	FRIENDLOCATION_PRIVHIDE: 4,
	FRIENDLOCATION_PRIVSHOW: 5,

	receivers: {},

	assignLength: function (buff) {
		var len = buff.length;
		// l = len(p)
		//   #p[2] = l % 256
		//   #p[3] = l / 256
		//   p[2:4] = pack('<H', l)
		// arr.splice(2, 1, l.toString(16));
		buff.write(len.toString(16), 2);

		return buff;
	},

	/**
	 *
	 * @param {Buffer} buff
	 * @returns {*}
	 */
	getLength: function (buff) {
		console.log('getLength', buff.toString('hex', 2, 4));
		return buff.toString('hex', 2, 4);
	},

	validateLength: function (buff) {
		return this.getLength(buff) === buff.length;
	},

	SEND_SID_PING: function (payload) {
		var buff = new Buffer([this.BNET_HEADER_CONSTANT, this.SID_PING, this.NULL_2, String(payload)]);

		buff = this.assignLength(buff);

		log('SEND_SID_PING');
		hex(buff);

		return buff;
	},

	SEND_PROTOCOL_INITIALIZE_SELECTOR: function () {
		var buf = new Buffer('\x01');

		log('SEND_PROTOCOL_INITIALIZE_SELECTOR');
		hex(buf);

		return buf;
	},

	SEND_SID_AUTH_INFO: function (ver, tft, localeID, countryAbbrev, country) {
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

		var buff = this.assignLength(Bytes.Array(bytes));

		console.log('SEND_SID_AUTH_INFO');
		hex(buff);
		return buff;
	},

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
	SEND_SID_AUTH_CHECK: function (tft, clientToken, exeVersion, exeVersionHash, keyInfoRoc, keyInfoTft, exeInfo, keyOwnerName) {
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

		return this.assignLength(Bytes.Array(bytes));
	},

	RECEIVE_SID_AUTH_INFO: function (buff) {
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
	},

	RECEIVE_SID_PING: function (buf) {
		assert(buf.length >= 8);
		return buf.slice(4, 8); // bytes(p[4:8])
	},

	RECEIVE_SID_AUTH_CHECK: function (buff) {
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
	},

	RECEIVE_SID_REQUIREDWORK: function () {
	},

	RECEIVE_SID_AUTH_ACCOUNTLOGON: function () {
	},

	RECEIVE_SID_AUTH_ACCOUNTLOGONPROOF: function () {
	},

	RECEIVE_SID_NULL: function () {
	},

	RECEIVE_SID_ENTERCHAT: function() {
	},

	RECEIVE_SID_CHATEVENT: function() {
	},

	RECEIVE_SID_CLANINFO: function() {
	}
});

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
