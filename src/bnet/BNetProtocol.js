import bp from 'bufferpack';
import assert from 'assert';
import {ValidateLength} from './../Bytes';
import Protocol from './../Protocol';
import Friend from './Friend';

import {create} from '../Logger';

const {debug, info, error} = create('BNetProtocol');

class BNetProtocol extends Protocol {

	BNET_HEADER_CONSTANT = '\xff';

	INITIALIZE_SELECTOR = '\x01';

	SID_AUTH_INFO = '\x50';
	SID_PING = '\x25';
	SID_AUTH_CHECK = '\x51';
	SID_REQUIREDWORK = '\x4c';
	SID_AUTH_ACCOUNTLOGON = '\x53';
	SID_AUTH_ACCOUNTLOGONPROOF = '\x54';
	SID_NULL = '\x00';
	SID_NETGAMEPORT = '\x45';
	SID_ENTERCHAT = '\x0a';
	SID_JOINCHANNEL = '\x0c';
	SID_CHATEVENT = '\x0f';
	SID_CHATCOMMAND = '\x0e';
	SID_CLANINFO = '\x75';
	SID_CLANMEMBERLIST = '\x7d';
	SID_CLANMEMBERSTATUSCHANGE = '\x7f';
	SID_MESSAGEBOX = '\x19';
	SID_CLANINVITATION = '\x77';
	SID_CLANMEMBERREMOVED = '\x7e';
	SID_FRIENDSUPDATE = '\x66';
	SID_FRIENDSLIST = '\x65';
	SID_FLOODDETECTED = '\x13';
	SID_FRIENDSADD = '\x67';

	KR_GOOD = '\x00\x00\x00\x00';
	KR_OLD_GAME_VERSION = '\x00\x01\x00\x00';
	KR_INVALID_VERSION = '\x01\x01\x00\x00';
	KR_ROC_KEY_IN_USE = '\x01\x02\x00\x00';
	KR_TFT_KEY_IN_USE = '\x11\x02\x00\x00';

	NULL = '\x00';
	NULL_2 = '\x00\x00';
	NULL_3 = '\x00\x00\x00';
	NULL_4 = '\x00\x00\x00\x00';

	// EID_SHOWUSER = '\x01\x00\x00\x00';
	// EID_JOIN = '\x02\x00\x00\x00';
	// EID_LEAVE = '\x03\x00\x00\x00';
	// EID_WHISPER = '\x04\x00\x00\x00';
	// EID_TALK = '\x05\x00\x00\x00';
	// EID_BROADCAST = '\x06\x00\x00\x00';
	// EID_CHANNEL = '\x07\x00\x00\x00';
	// EID_USERFLAGS = '\x09\x00\x00\x00';
	// EID_WHISPERSENT = '\x0a\x00\x00\x00';
	// EID_CHANNELFULL = '\x0d\x00\x00\x00';
	// EID_CHANNELDOESNOTEXIST = '\x0e\x00\x00\x00';
	// EID_CHANNELRESTRICTED = '\x0f\x00\x00\x00';
	// EID_INFO = '\x12\x00\x00\x00';
	// EID_ERROR = '\x13\x00\x00\x00';
	// EID_EMOTE = '\x17\x00\x00\x00';

	EID_SHOWUSER = 1;	// received when you join a channel (includes users in the channel and their information)
	EID_JOIN = 2;	// received when someone joins the channel you're currently in
	EID_LEAVE = 3;	// received when someone leaves the channel you're currently in
	EID_WHISPER = 4;	// received a whisper message
	EID_TALK = 5;	// received when someone talks in the channel you're currently in
	EID_BROADCAST = 6;	// server broadcast
	EID_CHANNEL = 7;	// received when you join a channel (includes the channel's name, flags)
	EID_USERFLAGS = 9;	// user flags updates
	EID_WHISPERSENT = 10;	// sent a whisper message
	EID_CHANNELFULL = 13;	// channel is full
	EID_CHANNELDOESNOTEXIST = 14;	// channel does not exist
	EID_CHANNELRESTRICTED = 15;	// channel is restricted
	EID_INFO = 18;	// broadcast/information message
	EID_ERROR = 19;	// error message
	EID_EMOTE = 23;	// emote

	CLANRANK_INITIATE = 0;
	CLANRANK_PEON = 1;
	CLANRANK_GRUNT = 2;
	CLANRANK_SHAMAN = 3;
	CLANRANK_CHIEFTAN = 4;

	// Bitfield
	FRIENDSTATUS_MUTUAL = 1;
	FRIENDSTATUS_DND = 2;
	FRIENDSTATUS_AWAY = 4;

	// Value
	FRIENDLOCATION_OFFLINE = 0;
	FRIENDLOCATION_NOTCHAT = 1;
	FRIENDLOCATION_CHAT = 2;
	FRIENDLOCATION_PUB = 3;
	FRIENDLOCATION_PRIVHIDE = 4;
	FRIENDLOCATION_PRIVSHOW = 5;

	constructor() {
		super();

		this.configureReceivers();
	}

	configureReceivers() {
		this.receivers = {};

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
			'SID_FRIENDSADD'
		]) {
			this.receivers[this[type].charCodeAt(0)] = this[`RECEIVE_${type}`];
		}
	}

	/**
	 * Basic function for construct packets for hosted game
	 * @param id Packet type
	 * @param args Packet data
	 * @returns {Buffer}
	 */
	asPacket(id, ...args) {
		return this.buffer(
			this.BNET_HEADER_CONSTANT,
			id,
			...args
		);
	}

	/**
	 * Checks if given buffer a BNet Packet
	 * @param {Buffer} buffer
	 * @returns {Boolean}
	 */
	haveHeader(buffer) {
		return String.fromCharCode(buffer[0]) === this.BNET_HEADER_CONSTANT;
	}

	SEND_SID_NULL() {
		return this.asPacket(this.SID_NULL);
	}

	SEND_SID_PING(payload) {
		debug('SEND_SID_PING');
		assert(payload.length === 4, 'invalid parameters passed to SEND_SID_PING');

		return this.asPacket(
			this.SID_PING,
			payload
		);
	}

	SEND_PROTOCOL_INITIALIZE_SELECTOR() {
		debug('SEND_PROTOCOL_INITIALIZE_SELECTOR');

		return Buffer.from(this.INITIALIZE_SELECTOR, 'binary');
	}

	SEND_SID_AUTH_INFO(ver, tft, localeID, countryAbbrev, country) {
		debug('SEND_SID_AUTH_INFO');

		const protocolID = this.NULL_4;
		const platformID = '68XI'; //[54, 56, 88, 73]; // "IX86"
		const productIdROC = '3RAW'; //[51, 82, 65, 87]; // "WAR3"
		const productIdTFT = 'XP3W'; //[80, 88, 51, 87]; // "W3XP"
		const version = [String(ver), 0, 0, 0];
		const language = 'SUne'; //[83, 85, 110, 101]; // "enUS"
		const localIP = '\x7f\x00\x00\x01'; //[127, 0, 0, 1];
		const timeZoneBias = '\x2c\x01\x00\x00'; //[44, 1, 0, 0];

		return this.asPacket(
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

	SEND_SID_AUTH_CHECK(tft, clientToken, exeVersion, exeVersionHash, keyInfoRoc, keyInfoTft, exeInfo, keyOwnerName) {
		const numKeys = (tft) ? 2 : 1;

		return this.asPacket(
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

	SEND_SID_AUTH_ACCOUNTLOGON(clientPublicKey, accountName) {
		assert(clientPublicKey.length === 32, 'public key length error');

		info('cd keys accepted');

		return this.asPacket(
			this.SID_AUTH_ACCOUNTLOGON,
			clientPublicKey,
			accountName,
			this.NULL
		);
	}

	SEND_SID_AUTH_ACCOUNTLOGONPROOF(M1) {
		assert(M1.length === 20, 'password length error');

		return this.asPacket(
			this.SID_AUTH_ACCOUNTLOGONPROOF,
			M1
		);
	}

	SEND_SID_NETGAMEPORT(serverPort) {
		return this.asPacket(
			this.SID_NETGAMEPORT,
			bp.pack('<H', serverPort)
		);
	}

	SEND_SID_ENTERCHAT() {
		return this.asPacket(
			this.SID_ENTERCHAT,
			this.NULL, //account name
			this.NULL //stat string
		);
	}

	SEND_SID_JOINCHANNEL(channel) {
		const noCreateJoin = '\x02\x00\x00\x00';
		const firstJoin = '\x01\x00\x00\x00';

		return this.asPacket(
			this.SID_JOINCHANNEL,
			channel.length > 0 ? noCreateJoin : firstJoin,
			channel,
			this.NULL
		);
	}

	SEND_SID_CHATCOMMAND(command) {
		return this.asPacket(
			this.SID_CHATCOMMAND,
			String(command),
			this.NULL
		);
	}

	SEND_SID_FRIENDSLIST() {
		return this.asPacket(
			this.SID_FRIENDSLIST
		);
	}

	SEND_SID_CLANMEMBERLIST() {
		const cookie = this.NULL_4;

		return this.asPacket(
			this.SID_CLANMEMBERLIST,
			cookie
		);
	}

	RECEIVE_SID_NULL(buff) {
		debug('RECEIVE_SID_NULL');

		return ValidateLength(buff);
	}

	RECEIVE_SID_GETADVLISTEX(buff) {
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

	RECEIVE_SID_AUTH_INFO(buff) {
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
		const ix86VerFileName = buff.slice(24).toString().split(this.NULL, 1)[0]; // p[24:].split(NULL, 1)[0]
		const valueStringFormula = buff.slice(25 + ix86VerFileName.length).toString().split(this.NULL, 1)[0]; // p[25 + len(ix86VerFileName):].split(this.NULL, 1)[0]

		return {
			logonType,
			serverToken,
			mpqFileTime,
			ix86VerFileName,
			valueStringFormula
		};
	};

	RECEIVE_SID_PING(buff) {
		debug('RECEIVE_SID_PING');
		assert(buff.length >= 8);
		return buff.slice(4, 8); // bytes(p[4:8])
	};

	RECEIVE_SID_AUTH_CHECK(buff) {
		debug('RECEIVE_SID_AUTH_CHECK');
		assert(ValidateLength(buff) && buff.length >= 9);
		// 2 bytes					-> Header
		// 2 bytes					-> Length
		// 4 bytes					-> KeyState
		// null terminated string	-> KeyStateDescription
		const keyState = buff.slice(4, 8);
		const keyStateDescription = buff.slice(8).toString().split(this.NULL, 1)[0];

		return {keyState, keyStateDescription};
	};

	RECEIVE_SID_REQUIREDWORK(buff) {
		debug('RECEIVE_SID_REQUIREDWORK');

		return ValidateLength(buff);
	}

	RECEIVE_SID_AUTH_ACCOUNTLOGON(buff) {
		assert(ValidateLength(buff) && buff.length >= 8);

		const status = buff.slice(4, 8);

		if (!(status.toString() === this.NULL_4.toString() && buff.length >= 72)) {
			error('buffer status is null');

			return false;
		}

		const salt = buff.slice(8, 40);
		const serverPublicKey = buff.slice(40, 72);

		return {status, salt, serverPublicKey};
	}

	RECEIVE_SID_AUTH_ACCOUNTLOGONPROOF(buff) {
		debug('RECEIVE_SID_AUTH_ACCOUNTLOGONPROOF');

		assert(ValidateLength(buff) && buff.length >= 8);

		const statusExpected = '\x0e000000';
		const status = buff.slice(4, 8);

		return (status.toString() === this.NULL_4.toString()
			|| status.toString() === statusExpected.toString()
		);
	}

	RECEIVE_SID_ENTERCHAT(buff) {
		debug('RECEIVE_SID_ENTERCHAT');
		assert(ValidateLength(buff) && buff.length >= 5);

		return buff.slice(4);
	}

	RECEIVE_SID_CHATEVENT(buff) {
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

		const id = buff.readInt32LE(4); //buff.slice(4, 8)
		const ping = buff.readInt32LE(12); //bp.unpack('<I', buff.slice(12, 16)).join('');
		const user = buff.slice(28).toString().split(this.NULL, 1)[0];
		const message = buff.slice(29 + user.length).toString().split(this.NULL, 1)[0];

		return {id, ping, user, message};
	}

	RECEIVE_SID_CHECKAD(buff) {
		debug('RECEIVE_SID_CHECKAD');
	}

	RECEIVE_SID_NETGAMEPORT(buff) {
		debug('RECEIVE_SID_NETGAMEPORT');
	}

	RECEIVE_SID_JOINCHANNEL(buff) {
		debug('RECEIVE_SID_JOINCHANNEL');
	}

	RECEIVE_SID_CHATCOMMAND(buff) {
		debug('RECEIVE_SID_CHATCOMMAND');
	}

	RECEIVE_SID_CLANMEMBERLIST(buff) {
		debug('RECEIVE_SID_CLANMEMBERLIST');
	}

	RECEIVE_SID_CLANMEMBERSTATUSCHANGE(buff) {
		debug('RECEIVE_SID_CLANMEMBERSTATUSCHANGE');
	}

	RECEIVE_SID_CLANINVITATION(buff) {
		debug('RECEIVE_SID_CLANINVITATION');
	}

	RECEIVE_SID_CLANMEMBERREMOVED(buff) {
		debug('RECEIVE_SID_CLANMEMBERREMOVED');
	}

	RECEIVE_SID_STARTADVEX3(buff) {
		debug('RECEIVE_SID_STARTADVEX3');
	}

	RECEIVE_SID_WARDEN(buff) {
		debug('RECEIVE_SID_WARDEN');
	}

	RECEIVE_SID_FRIENDSUPDATE(buff) {
		debug('RECEIVE_SID_FRIENDSUPDATE')
	}

	RECEIVE_SID_FRIENDSLIST(buff) {
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

			const account = bp.unpack('<S', buff.slice(i))[0];

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

	RECEIVE_SID_FLOODDETECTED(buff) {
		debug('RECEIVE_SID_FLOODDETECTED')
	}

	RECEIVE_SID_CLANINFO(buff) {
		debug('RECEIVE_SID_CLANINFO');
	}

	RECEIVE_SID_MESSAGEBOX(buff) {
		debug('RECEIVE_SID_MESSAGEBOX');
	}

	RECEIVE_SID_FRIENDSADD(buff) {
		debug('RECEIVE_SID_FRIENDSADD');
	}
}

export default BNetProtocol;
