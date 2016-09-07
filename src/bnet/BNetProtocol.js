import bp from 'bufferpack';
import hex from 'hex';
import assert from 'assert';
import {ValidateLength, AsHex} from './../Bytes';
import Protocol from './../Protocol';
import BNetBuffer from './BNetBuffer';
import Friend from './Friend';
import chalk from 'chalk';

import {create} from '../Logger';

const {debug, info, error} = create('BNetProtocol');

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
	 * Checks if given buffer a BNet Packet
	 * @param {Buffer} buffer
	 * @returns {Boolean}
	 */
	static haveHeader(buffer) {
		return String.fromCharCode(buffer[0]) === BNetProtocol.BNET_HEADER_CONSTANT;
	}

	static SEND_SID_NULL() {
		return BNetBuffer(this.SID_NULL);
	}

	static SEND_SID_PING(payload) {
		debug('SEND_SID_PING');
		assert(payload.length === 4, 'invalid parameters passed to SEND_SID_PING');

		return BNetBuffer(
			this.SID_PING,
			payload
		);
	}

	static SEND_PROTOCOL_INITIALIZE_SELECTOR() {
		debug('SEND_PROTOCOL_INITIALIZE_SELECTOR');

		return Buffer.from('\x01', 'binary');
	}

	static SEND_SID_AUTH_INFO(ver, tft, localeID, countryAbbrev, country) {
		debug('SEND_SID_AUTH_INFO');

		const protocolID = this.NULL_4;
		const platformID = '68XI'; //[54, 56, 88, 73]; // "IX86"
		const productIdROC = '3RAW'; //[51, 82, 65, 87]; // "WAR3"
		const productIdTFT = 'XP3W'; //[80, 88, 51, 87]; // "W3XP"
		const version = [String(ver), 0, 0, 0];
		const language = 'SUne'; //[83, 85, 110, 101]; // "enUS"
		const localIP = '\x7f\x00\x00\x01'; //[127, 0, 0, 1];
		const timeZoneBias = '\x2c\x01\x00\x00'; //[44, 1, 0, 0];

		return BNetBuffer(
			this.SID_AUTH_INFO,
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
		);
	}

	static SEND_SID_AUTH_CHECK(tft, clientToken, exeVersion, exeVersionHash, keyInfoRoc, keyInfoTft, exeInfo, keyOwnerName) {
		const numKeys = (tft) ? 2 : 1;

		return BNetBuffer(
			this.SID_AUTH_CHECK,
			clientToken,
			exeVersion,
			exeVersionHash,
			[numKeys, 0, 0, 0],
			this.NULL_4,
			keyInfoRoc,
			tft ? keyInfoTft : false, //if it false, its excluded
			exeInfo,
			this.NULL,
			keyOwnerName,
			this.NULL
		);
	}

	static SEND_SID_AUTH_ACCOUNTLOGON(clientPublicKey, accountName) {
		assert(clientPublicKey.length === 32, 'public key length error');

		info('cd keys accepted');

		return BNetBuffer(
			this.SID_AUTH_ACCOUNTLOGON,
			clientPublicKey,
			accountName,
			this.NULL
		);
	}

	static SEND_SID_AUTH_ACCOUNTLOGONPROOF(M1) {
		assert(M1.length === 20, 'password length error');

		return BNetBuffer(
			this.SID_AUTH_ACCOUNTLOGONPROOF,
			M1
		);
	}

	static SEND_SID_NETGAMEPORT(serverPort) {
		return BNetBuffer(
			this.SID_NETGAMEPORT,
			bp.pack('<H', serverPort)
		);
	}

	static SEND_SID_ENTERCHAT() {
		return BNetBuffer(
			this.SID_ENTERCHAT,
			this.NULL, //account name
			this.NULL //stat string
		);
	}

	static SEND_SID_FRIENDSLIST() {
		return BNetBuffer(
			this.SID_FRIENDSLIST
		);
	}

	static SEND_SID_CLANMEMBERLIST() {
		const cookie = this.NULL_4;

		return BNetBuffer(
			this.SID_CLANMEMBERLIST,
			cookie
		);
	}

	static SEND_SID_JOINCHANNEL(channel) {
		const noCreateJoin = '\x02\x00\x00\x00';
		const firstJoin = '\x01\x00\x00\x00';

		return BNetBuffer(
			this.SID_JOINCHANNEL,
			channel.length > 0 ? noCreateJoin : firstJoin,
			channel,
			this.NULL
		);
	}

	static RECEIVE_SID_NULL(buff) {
		debug('RECEIVE_SID_NULL');

		return ValidateLength(buff);
	}

	static RECEIVE_SID_GETADVLISTEX(buff) {
		debug('RECEIVE_SID_GETADVLISTEX');
		// 2 bytes					-> Header
		// 2 bytes					-> Length
		// 4 bytes					-> GamesFound
		// if( GamesFound > 0 )
		//		10 bytes			-> ???
		//		2 bytes				-> Port
		//		4 bytes				-> IP
		//		null term string	-> GameName
		//		2 bytes				-> ???
		//		8 bytes				-> HostCounter

		if (ValidateLength(buff) && buff.length >= 8) {
			const gamesFound = buff.readInt32LE(4);

			if (gamesFound > 0 && buff.length >= 25) {

			}
		}

		//@TODO RECEIVE_SID_GETADVLISTEX
		// DEBUG_Print( "RECEIVED SID_GETADVLISTEX" );
		// DEBUG_Print( data );


		// if( ValidateLength( data ) && data.size( ) >= 8 )
		// {
		// 	BYTEARRAY GamesFound = BYTEARRAY( data.begin( ) + 4, data.begin( ) + 8 );
		//
		// 	if( UTIL_ByteArrayToUInt32( GamesFound, false ) > 0 && data.size( ) >= 25 )
		// 	{
		// 		BYTEARRAY Port = BYTEARRAY( data.begin( ) + 18, data.begin( ) + 20 );
		// 		BYTEARRAY IP = BYTEARRAY( data.begin( ) + 20, data.begin( ) + 24 );
		// 		BYTEARRAY GameName = UTIL_ExtractCString( data, 24 );
		//
		// 		if( data.size( ) >= GameName.size( ) + 35 )
		// 		{
		// 			BYTEARRAY HostCounter;
		// 			HostCounter.push_back( UTIL_ExtractHex( data, GameName.size( ) + 27, true ) );
		// 			HostCounter.push_back( UTIL_ExtractHex( data, GameName.size( ) + 29, true ) );
		// 			HostCounter.push_back( UTIL_ExtractHex( data, GameName.size( ) + 31, true ) );
		// 			HostCounter.push_back( UTIL_ExtractHex( data, GameName.size( ) + 33, true ) );
		// 			return new CIncomingGameHost(	IP,
		// 											UTIL_ByteArrayToUInt16( Port, false ),
		// 											string( GameName.begin( ), GameName.end( ) ),
		// 											HostCounter );
		// 		}
		// 	}
		// }
		//
		// return NULL;
	}

	static RECEIVE_SID_AUTH_INFO(buff) {
		debug('RECEIVE_SID_AUTH_INFO');
		assert(ValidateLength(buff) && buff.length >= 25, 'RECEIVE_SID_AUTH_INFO');
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
		assert(ValidateLength(buff) && buff.length >= 9);
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

		return ValidateLength(buff);
	}

	static RECEIVE_SID_AUTH_ACCOUNTLOGON(buff) {
		assert(ValidateLength(buff) && buff.length >= 8);

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

		assert(ValidateLength(buff) && buff.length >= 8);

		const statusExpected = '\x0e000000';
		const status = buff.slice(4, 8);

		return (status.toString() === BNetProtocol.NULL_4.toString()
			|| status.toString() === statusExpected.toString()
		);
	}

	static RECEIVE_SID_ENTERCHAT(buff) {
		debug('RECEIVE_SID_ENTERCHAT');
		assert(ValidateLength(buff) && buff.length >= 5);

		return buff.slice(4);
	}

	static RECEIVE_SID_CHATEVENT(buff) {
		debug('RECEIVE_SID_CHATEVENT');
		assert(ValidateLength(buff) && buff.length >= 29, 'RECEIVE_SID_CHATEVENT');

		// 2 bytes					-> Header
		// 2 bytes					-> Length
		// 4 bytes					-> EventID
		// 4 bytes					-> ???
		// 4 bytes					-> Ping
		// 12 bytes					-> ???
		// null terminated string	-> User
		// null terminated string	-> Message

		const event = buff.slice(4, 8);
		const ping = buff.readInt32LE(12); //bp.unpack('<I', buff.slice(12, 16)).join('');
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
			case AsHex(BNetProtocol.EID_SHOWUSER):
				return 'SHOWUSER';
			case AsHex(BNetProtocol.EID_JOIN):
				return 'JOIN';
			case AsHex(BNetProtocol.EID_LEAVE):
				return 'LEAVE';
			case AsHex(BNetProtocol.EID_WHISPER):
				return 'WHISPER';
			case AsHex(BNetProtocol.EID_TALK):
				return 'TALK';
			case AsHex(BNetProtocol.EID_BROADCAST):
				return 'BROADCAST';
			case AsHex(BNetProtocol.EID_CHANNEL):
				return 'CHANNEL';
			case AsHex(BNetProtocol.EID_USERFLAGS):
				return 'USERFLAGS';
			case AsHex(BNetProtocol.EID_WHISPERSENT):
				return 'WHISPERSENT';
			case AsHex(BNetProtocol.EID_CHANNELFULL):
				return 'CHANNELFULL';
			case AsHex(BNetProtocol.EID_CHANNELDOESNOTEXIST):
				return 'CHANNELDOESNOTEXIST';
			case AsHex(BNetProtocol.EID_CHANNELRESTRICTED):
				return 'CHANNELRESTRICTED';
			case AsHex(BNetProtocol.EID_INFO):
				return 'INFO';
			case AsHex(BNetProtocol.EID_ERROR):
				return 'ERROR';
			case AsHex(BNetProtocol.EID_EMOTE):
				return 'EMOTE';
		}
	}

	static RECEIVE_SID_CHECKAD(buff) {
		debug('RECEIVE_SID_CHECKAD');
	}

	static RECEIVE_SID_NETGAMEPORT(buff) {
		debug('RECEIVE_SID_NETGAMEPORT');
	}

	static RECEIVE_SID_JOINCHANNEL(buff) {
		debug('RECEIVE_SID_JOINCHANNEL');
	}

	static RECEIVE_SID_CHATCOMMAND(buff) {
		debug('RECEIVE_SID_CHATCOMMAND');
	}

	static RECEIVE_SID_CLANMEMBERLIST(buff) {
		debug('RECEIVE_SID_CLANMEMBERLIST');
	}

	static RECEIVE_SID_CLANMEMBERSTATUSCHANGE(buff) {
		debug('RECEIVE_SID_CLANMEMBERSTATUSCHANGE');
	}

	static RECEIVE_SID_CLANINVITATION(buff) {
		debug('RECEIVE_SID_CLANINVITATION');
	}

	static RECEIVE_SID_CLANMEMBERREMOVED(buff) {
		debug('RECEIVE_SID_CLANMEMBERREMOVED');
	}

	static RECEIVE_SID_STARTADVEX3(buff) {
		debug('RECEIVE_SID_STARTADVEX3');
	}

	static RECEIVE_SID_WARDEN(buff) {
		debug('RECEIVE_SID_WARDEN');
	}

	static RECEIVE_SID_FRIENDSUPDATE(buff) {
		debug('RECEIVE_SID_FRIENDSUPDATE')
	}

	static RECEIVE_SID_FRIENDSLIST(buff) {
		debug('RECEIVE_SID_FRIENDSLIST');
		assert(ValidateLength(buff) && buff.length >= 5, 'RECEIVE_SID_FRIENDSLIST');

		// 2 bytes					-> Header
		// 2 bytes					-> Length
		// 1 byte					-> Total
		// for( 1 .. Total )
		//		null term string	-> Account
		//		1 byte				-> Status
		//		1 byte				-> Area
		//		4 bytes				-> ???
		//		null term string	-> Location

		var friends = [];
		var total = buff[4];
		var i = 5;

		while (total > 0) {
			total--;

			if (buff.length < i + 1) {
				break;
			}

			const account =  bp.unpack('<S', buff.slice(i))[0];

			i += account.length + 1;

			if (buff.length < i + 7) {
				break;
			}

			const status = buff[i]; //uchar
			const area = buff[i + 1]; //uchar
			const client = buff.slice(i + 2, i + 6).toString().split('').reverse().join(''); //4 chars client

			i += 6;

			const location = bp.unpack('<S', buff.slice(i))[0];
			i += location.length + 1;

			friends.push(new Friend(account, status, area, client, location))
		}

		return friends;
	}

	static RECEIVE_SID_FLOODDETECTED(buff) {
		debug('RECEIVE_SID_FLOODDETECTED')
	}

	static RECEIVE_SID_CLANINFO(buff) {
		debug('RECEIVE_SID_CLANINFO');
	}

	static RECEIVE_SID_MESSAGEBOX(buff) {
		debug('RECEIVE_SID_MESSAGEBOX');
	}

	static RECEIVE_SID_FRIENDSADD(buff) {
		debug('RECEIVE_SID_FRIENDSADD');
	}
}

export const receivers = {
	[BNetProtocol.SID_AUTH_INFO.charCodeAt(0)]: BNetProtocol.RECEIVE_SID_AUTH_INFO,
	[BNetProtocol.SID_PING.charCodeAt(0)]: BNetProtocol.RECEIVE_SID_PING,
	[BNetProtocol.SID_AUTH_CHECK.charCodeAt(0)]: BNetProtocol.RECEIVE_SID_AUTH_CHECK,
	[BNetProtocol.SID_REQUIREDWORK.charCodeAt(0)]: BNetProtocol.RECEIVE_SID_REQUIREDWORK,
	[BNetProtocol.SID_AUTH_ACCOUNTLOGON.charCodeAt(0)]: BNetProtocol.RECEIVE_SID_AUTH_ACCOUNTLOGON,
	[BNetProtocol.SID_AUTH_ACCOUNTLOGONPROOF.charCodeAt(0)]: BNetProtocol.RECEIVE_SID_AUTH_ACCOUNTLOGONPROOF,
	[BNetProtocol.SID_NULL.charCodeAt(0)]: BNetProtocol.RECEIVE_SID_NULL,
	[BNetProtocol.SID_NETGAMEPORT.charCodeAt(0)]: BNetProtocol.RECEIVE_SID_NETGAMEPORT,
	[BNetProtocol.SID_ENTERCHAT.charCodeAt(0)]: BNetProtocol.RECEIVE_SID_ENTERCHAT,
	[BNetProtocol.SID_JOINCHANNEL.charCodeAt(0)]: BNetProtocol.RECEIVE_SID_JOINCHANNEL,
	[BNetProtocol.SID_CHATEVENT.charCodeAt(0)]: BNetProtocol.RECEIVE_SID_CHATEVENT,
	[BNetProtocol.SID_CHATCOMMAND.charCodeAt(0)]: BNetProtocol.RECEIVE_SID_CHATCOMMAND,
	[BNetProtocol.SID_CLANINFO.charCodeAt(0)]: BNetProtocol.RECEIVE_SID_CLANINFO,
	[BNetProtocol.SID_CLANMEMBERLIST.charCodeAt(0)]: BNetProtocol.RECEIVE_SID_CLANMEMBERLIST,
	[BNetProtocol.SID_CLANMEMBERSTATUSCHANGE.charCodeAt(0)]: BNetProtocol.RECEIVE_SID_CLANMEMBERSTATUSCHANGE,
	[BNetProtocol.SID_MESSAGEBOX.charCodeAt(0)]: BNetProtocol.RECEIVE_SID_MESSAGEBOX,
	[BNetProtocol.SID_CLANINVITATION.charCodeAt(0)]: BNetProtocol.RECEIVE_SID_CLANINVITATION,
	[BNetProtocol.SID_CLANMEMBERREMOVED.charCodeAt(0)]: BNetProtocol.RECEIVE_SID_CLANMEMBERREMOVED,
	[BNetProtocol.SID_FRIENDSUPDATE.charCodeAt(0)]: BNetProtocol.RECEIVE_SID_FRIENDSUPDATE,
	[BNetProtocol.SID_FRIENDSLIST.charCodeAt(0)]: BNetProtocol.RECEIVE_SID_FRIENDSLIST,
	[BNetProtocol.SID_FLOODDETECTED.charCodeAt(0)]: BNetProtocol.RECEIVE_SID_FLOODDETECTED,
	[BNetProtocol.SID_FRIENDSADD.charCodeAt(0)]: BNetProtocol.RECEIVE_SID_FRIENDSADD,
};

export default BNetProtocol;
