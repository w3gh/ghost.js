'use strict';

import log from './../log';
import util from 'util';
import { ByteArray, ByteString } from './../Bytes';
import Protocol from './../Protocol';
import bp from 'bufferpack';
import hex from 'hex';

/**
 * @param {Array} data
 * @returns {Array}

 unsigned char Mask = 1;
 BYTEARRAY Result;

 for( unsigned int i = 0; i < data.size( ); ++i )
 {
	if( ( data[i] % 2 ) == 0 )
		Result.push_back( data[i] + 1 );
	else
	{
		Result.push_back( data[i] );
		Mask |= 1 << ( ( i % 7 ) + 1 );
	}

	if( i % 7 == 6 || i == data.size( ) - 1 )
	{
		Result.insert( Result.end( ) - 1 - ( i % 7 ), Mask );
		Mask = 1;
	}
}

 return Result;
 */
function encodeStatString(data) {
	var mask = 1;
	var result = [];
	var length = data.length ? data.length : 0;
	var i = 0;

	for (i < length; i++;) {
		if (data[i] % 2 == 0) {
			result.push(data[i] + 1);
		} else {
			result.push(data[i]);
			mask |= 1 << ( (i % 7) + 1 );
		}

		if (i % 7 == 6 || i == data.length - 1) {
			result.splice(result.length - 1 - (i % 7), 0, mask);
			mask = 1;
		}
	}

	return result;
}

/**
 *
 * @param buff
 * @returns {*}
 */
function assignLength(buff) {
	var len = buff.length;

	if (len >= 4 && len <= 65535) {
		var packed = bp.pack('<H', [len]).toJSON();

		buff[2] = packed[0];
		buff[3] = packed[1];
	} else {
		throw 'game protocol buffer length error, given ' + len;
	}

	return buff;
}

class GameProtocol extends Protocol {
	encodeSlotInfo(slots, /*uint32*/ randomSeed,/*uchar*/layoutStyle, /*uchar*/playerSlots) {
		var slotInfo = [
			[slots.length]
		];

		for (var i = 0; i < slots.length; ++i) {
			slotInfo.push(slots[i].byteArray());
		}

		slotInfo.push(bp.pack('<I', [randomSeed]));
		slotInfo.push([layoutStyle]);
		slotInfo.push([playerSlots]);

		return ByteArray(slotInfo);
	}

	SEND_W3GS_PING_FROM_HOST() {
	}

	SEND_W3GS_SLOTINFOJOIN() {
	}

	SEND_W3GS_REJECTJOIN(/* uint32 */ reason) {
		var packet = [];

		packet.push([
			GameProtocol.W3GS_HEADER_CONSTANT, // W3GS header constant
			GameProtocol.W3GS_REJECTJOIN, // W3GS_REJECTJOIN
			0, // packet length will be assigned later
			0, // packet length will be assigned later
			reason // reason
		]);

		return this.assignLength(ByteArray(packet));
	}

	SEND_W3GS_PLAYERINFO() {
	}

	SEND_W3GS_PLAYERLEAVE_OTHERS() {
	}

	SEND_W3GS_GAMELOADED_OTHERS() {
	}

	SEND_W3GS_SLOTINFO() {
	}

	SEND_W3GS_COUNTDOWN_START() {
	}

	SEND_W3GS_COUNTDOWN_END() {
	}

	SEND_W3GS_INCOMING_ACTION() {
	}

	SEND_W3GS_CHAT_FROM_HOST() {
	}

	SEND_W3GS_START_LAG() {
	}

	SEND_W3GS_STOP_LAG() {
	}

	SEND_W3GS_SEARCHGAME() {
	}

	SEND_W3GS_GAMEINFO(TFT,
	                   war3Version,
	                   mapGameType,
	                   mapFlags,
	                   mapWidth,
	                   mapHeight,
	                   gameName,
	                   hostName,
	                   upTime,
	                   mapPath,
	                   mapCRC,
	                   slotsTotal,
	                   slotsOpen,
	                   port,
	                   hostCounter) {
		log('SEND_W3GS_GAMEINFO');

		/**
		 000000   F7 30 38 34 50 58 33 57 1A 00 00 00 01 00 00 00   ÷084PX3W........
		 000010   00 00 00 00 47 48 6F 73 74 2B 2B 20 41 64 6D 69   ....GHost++ Admi
		 000020   6E 20 47 61 6D 65 00 01 03 49 07 01 01 AD 01 C1   n Game...I...­.Á
		 000030   AD 01 6D FB CD 3B 4D 8B 61 71 73 5D 47 73 6F 85   ­.mûÍ;M.aqs]Gso.
		 000040   7B 65 6F 55 69 73 6F A5 6F 65 5D 29 31 33 29 2F   {eoUiso¥oe])13)/
000050   45 6D 65 73 61 6D 65 A7 47 61 73 65 65 6F 73 4D   Emesame§GaseeosM
000060   2F 77 33 79 57 61 73 1D 6D 6F 63 6B 01 00 0C 00   /w3yWas.mock....
000070   00 00 01 00 00 00 01 00 00 00 0C 00 00 00 05 00   ................
000080   00 00 E2 17                                       ..â.



// ghost++
000000   F7 30 87 00 50 58 33 57 1A 00 00 00 01 00 00 00   ÷0..PX3W........
000010   00 00 00 00 47 48 6F 73 74 2B 2B 20 41 64 6D 69   ....GHost++ Admi
000020   6E 20 47 61 6D 65 00 00 01 03 49 07 01 01 AD 01   n Game....I...­.
000030   C1 AD 01 6D FB CD 3B 4D 8B 61 71 73 5D 47 73 6F   Á­.mûÍ;M.aqs]Gso
000040   85 7B 65 6F 55 69 73 6F A5 6F 65 5D 29 31 33 29   .{eoUiso¥oe])13)
000050   2F 45 6D 65 73 61 6D 65 A7 47 61 73 65 65 6F 73   /Emesame§Gaseeos
000060   8D 2F 77 33 79 01 57 61 39 73 6D 6F 63 6B 01 01   ./w3y.Wa9smock..
000070   00 0C 00 00 00 01 00 00 00 01 00 00 00 0C 00 00   ................
000080   00 B3 0B 00 00 E1 17                              .³...á.

statString

00 01 03 49 07 01 01 AD 01 C1 AD 01 6D FB CD 3B 4D 8B 61 71 73 5D 47 73 6F 85 7B 65 6F 55 69 73 6F A5 6F 65 5D 29 31 33 29 2F 45 6D 65 73 61 6D 65 A7 47 61 73 65 65 6F 73 8D 2F 77 33 79 01 57 61 39 73 6D 6F 63 6B 01 01

		 */

		var productID_ROC = '3RAW'; // "WAR3"
		var productID_TFT = 'PX3W'; // "W3XP
		var entryKey = [0, 0, 0, 0]; // game pass
		var unknown2 = [1, 0, 0, 0];

		var packet = [];

		if (mapGameType.length === 4 &&
			mapFlags.length === 4 &&
			mapWidth.length === 2 &&
			mapHeight.length === 2 && gameName && hostName && mapPath &&
			mapCRC.length === 4) {

			var statArray = [].concat(
				mapFlags.toJSON(),
				[0],
				mapWidth.toJSON(),
				mapHeight.toJSON(),
				mapCRC.toJSON(),
				ByteString(mapPath),
				ByteString(hostName),
				[0]
			);

			var stat = encodeStatString(statArray);

			packet.push([
				GameProtocol.W3GS_HEADER_CONSTANT,
				GameProtocol.W3GS_GAMEINFO,
				0,
				0 // length assigned later
			]);

			packet.push(TFT ? productID_TFT : productID_ROC);
			packet.push(bp.pack('<I', [war3Version]));
			packet.push(bp.pack('<I', [hostCounter]));
			packet.push(entryKey);
			packet.push(gameName);
			packet.push(GameProtocol.NULL_2);
			packet.push(stat);
			packet.push(GameProtocol.NULL);
			packet.push(bp.pack('<I', [slotsTotal]));
			packet.push(mapGameType);
			packet.push(unknown2);
			packet.push(bp.pack('<I', [slotsOpen]));
			packet.push(bp.pack('<I', [upTime])); // upTime
			packet.push(bp.pack('<H', [port]));

			var bytes = this.assignLength(ByteArray(packet));

			if (bytes.toJSON().length > 166) {
				log('erro bytes to big', bytes.toJSON().length);
			}

			hex(bytes);

			return bytes;
		} else {
			throw 'invalid parameters passed to SEND_W3GS_GAMEINFO';
		}

	}

	SEND_W3GS_CREATEGAME() {
	}

	SEND_W3GS_REFRESHGAME() {
	}

	SEND_W3GS_DECREATEGAME() {
	}

	RECEIVE_W3GS_REQJOIN(buffer) {
		// 2 bytes					-> Header
		// 2 bytes					-> Length
		// 4 bytes					-> Host Counter (Game ID)
		// 4 bytes					-> Entry Key (used in LAN)
		// 1 byte					-> ???
		// 2 bytes					-> Listen Port
		// 4 bytes					-> Peer Key
		// null terminated string	-> Name
		// 4 bytes					-> ???
		// 2 bytes					-> InternalPort (???)
		// 4 bytes					-> InternalIP

		log('RECEIVE_W3GS_REQJOIN', buffer.length, this.validateLength(buffer));
		hex(buffer);

		if (this.validateLength(buffer) && buffer.length >= 20) {
			var hostCounter = bp.unpack('<I', buffer, 4)[0];
			var entryKey = bp.unpack('<I', buffer, 8)[0];
			var name = bp.unpack('<S', buffer, 19)[0];

			if (name.length && buffer.length >= name.length + 30) {
				var internalIPBuffer = buffer.slice(26 + name.length, 30 + name.length);
				return new IncomingJoinPlayer(hostCounter, entryKey, name, internalIPBuffer);
			}

			/**
			 uint32_t HostCounter = UTIL_ByteArrayToUInt32( data, false, 4 );
			 uint32_t EntryKey = UTIL_ByteArrayToUInt32( data, false, 8 );
			 BYTEARRAY Name = UTIL_ExtractCString( data, 19 );

			 if( !Name.empty( ) && data.size( ) >= Name.size( ) + 30 )
			 {
				BYTEARRAY InternalIP = BYTEARRAY( data.begin( ) + Name.size( ) + 26, data.begin( ) + Name.size( ) + 30 );
				return new CIncomingJoinPlayer( HostCounter, EntryKey, string( Name.begin( ), Name.end( ) ), InternalIP );
			}
			 */

		}
	}

	RECEIVE_W3GS_LEAVEGAME() {
	}

	RECEIVE_W3GS_GAMELOADED_SELF() {
	}

	RECEIVE_W3GS_OUTGOING_ACTION() {
	}

	RECEIVE_W3GS_OUTGOING_KEEPALIVE() {
	}

	RECEIVE_W3GS_CHAT_TO_HOST() {
	}

	RECEIVE_W3GS_SEARCHGAME() {
	}

	RECEIVE_W3GS_MAPSIZE() {
	}

	RECEIVE_W3GS_MAPPARTOK() {
	}

	RECEIVE_W3GS_PONG_TO_HOST() {
	}
}

Object.assign(GameProtocol, {
	W3GS_HEADER_CONSTANT: 247,

	GAME_NONE: '\x00',
	GAME_FULL: '\x02',

	GAME_PUBLIC: '\x10',
	GAME_PRIVATE: '\x11',

	GAMETYPE_CUSTOM: '\x01',
	GAMETYPE_BLIZZARD: '\x09',

	PLAYERLEAVE_DISCONNECT: 1,
	PLAYERLEAVE_LOST: 7,
	PLAYERLEAVE_LOSTBUILDINGS: 8,
	PLAYERLEAVE_WON: 9,
	PLAYERLEAVE_DRAW: 10,
	PLAYERLEAVE_OBSERVER: 11,
	PLAYERLEAVE_LOBBY: 13,
	PLAYERLEAVE_GPROXY: 100,

	REJECTJOIN_FULL: 9,
	REJECTJOIN_STARTED: 10,
	REJECTJOIN_WRONGPASSWORD: 27,

	W3GS_PING_FROM_HOST: 1,	// 0x01
	W3GS_SLOTINFOJOIN: 4,	// 0x04
	W3GS_REJECTJOIN: 5,	// 0x05
	W3GS_PLAYERINFO: 6,	// 0x06
	W3GS_PLAYERLEAVE_OTHERS: 7,	// 0x07
	W3GS_GAMELOADED_OTHERS: 8,	// 0x08
	W3GS_SLOTINFO: 9,	// 0x09
	W3GS_COUNTDOWN_START: 10,	// 0x0A
	W3GS_COUNTDOWN_END: 11,	// 0x0B
	W3GS_INCOMING_ACTION: 12,	// 0x0C
	W3GS_CHAT_FROM_HOST: 15,	// 0x0F
	W3GS_START_LAG: 16,	// 0x10
	W3GS_STOP_LAG: 17,	// 0x11
	W3GS_HOST_KICK_PLAYER: 28,	// 0x1C
	W3GS_REQJOIN: 30,	// 0x1E
	W3GS_LEAVEGAME: 33,	// 0x21
	W3GS_GAMELOADED_SELF: 35,	// 0x23
	W3GS_OUTGOING_ACTION: 38,	// 0x26
	W3GS_OUTGOING_KEEPALIVE: 39,	// 0x27
	W3GS_CHAT_TO_HOST: 40,	// 0x28
	W3GS_DROPREQ: 41,	// 0x29
	W3GS_SEARCHGAME: 47,	// 0x2F (UDP/LAN)
	W3GS_GAMEINFO: 48,	// 0x30 (UDP/LAN)
	W3GS_CREATEGAME: 49,	// 0x31 (UDP/LAN)
	W3GS_REFRESHGAME: 50,	// 0x32 (UDP/LAN)
	W3GS_DECREATEGAME: 51,	// 0x33 (UDP/LAN)
	W3GS_CHAT_OTHERS: 52,	// 0x34
	W3GS_PING_FROM_OTHERS: 53,	// 0x35
	W3GS_PONG_TO_OTHERS: 54,	// 0x36
	W3GS_MAPCHECK: 61,	// 0x3D
	W3GS_STARTDOWNLOAD: 63,	// 0x3F
	W3GS_MAPSIZE: 66,	// 0x42
	W3GS_MAPPART: 67,	// 0x43
	W3GS_MAPPARTOK: 68,	// 0x44
	W3GS_MAPPARTNOTOK: 69,	// 0x45 - just a guess, received this packet after forgetting to send a crc in W3GS_MAPPART (f7 45 0a 00 01 02 01 00 00 00)
	W3GS_PONG_TO_HOST: 70,	// 0x46
	W3GS_INCOMING_ACTION2: 72,	// 0x48 - received this packet when there are too many actions to fit in W3GS_INCOMING_ACTION

	NULL: '\x00',
	NULL_2: '\x00\x00',
	NULL_3: '\x00\x00\x00',
	NULL_4: '\x00\x00\x00\x00',

	receivers: {}
});

/**
 *
 * @param {Number} hostCounter
 * @param {Number} entryKey
 * @param {String} name
 * @param {Buffer} internalIPBuffer
 * @constructor
 */
export class IncomingJoinPlayer {
	constructor(hostCounter, entryKey, name, internalIP) {
		this.hostCounter = hostCounter;
		this.entryKey = entryKey;
		this.name = name;
		this.internalIP = internalIP;
	}
}

export default GameProtocol;