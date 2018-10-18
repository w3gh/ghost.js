import * as assert from 'assert';
import {localIP, getTimezone} from '../util';
import {ValidateLength, ByteUInt32, ByteString, ByteExtractString, ByteExtractUInt32, ByteArray} from '../Bytes';
import {Protocol} from '../Protocol';

import {create, hex} from '../Logger';
import {BNetConnection} from "./BNetConnection";
import {IncomingChatEvent} from "./IncomingChatEvent";
import {AccountLogonProof} from "./AccountLogonProof";
import {SIDGetAdvListEx} from "./SIDGetAdvListEx";
import {AuthInfo} from "./AuthInfo";
import {AuthState} from "./AuthState";
import {AccountLogon} from "./AccountLogon";
import {FriendList} from "./FriendList";
import {ClanMemberList} from "./ClanMemberList";
import {IncomingClanList} from "./IncomingClanList";

const {debug, info, error} = create('BNetProtocol');


/*
  0x000: Passed challenge
  0x100: Old game version (Additional info field supplies patch MPQ filename)
  0x101: Invalid version
  0x102: Game version must be downgraded (Additional info field supplies patch MPQ filename)
  0x0NN: (where NN is the version code supplied in SID_AUTH_INFO): Invalid version code (note that 0x100 is not set in this case).
  0x200: Invalid CD key *
  0x201: CD key in use (Additional info field supplies name of user)
  0x202: Banned key
  0x203: Wrong product
  */
export enum BNetKR {
    OLD_GAME_VERSION = 0x100, //0x100
    INVALID_VERSION = 0x101, //0x101
    MUST_BE_DOWNGRADED = 0x102, //0x102
    INVALID_CD_KEY = 0x200, //0x200
    ROC_KEY_IN_USE = 0x201, //0x201
    TFT_KEY_IN_USE = 0x211, //0x211
    BANNED_KEY = 0x202, //0x202
    WRONG_PRODUCT = 0x203, //0x203
}

export enum BNetFriendStatus {
    // Bitfield
    FRIENDSTATUS_MUTUAL = 1,
    FRIENDSTATUS_DND = 2,
    FRIENDSTATUS_AWAY = 4,
}

export enum BNetFriendLocation {
    // Value
    FRIENDLOCATION_OFFLINE = 0,
    FRIENDLOCATION_NOTCHAT = 1,
    FRIENDLOCATION_CHAT = 2,
    FRIENDLOCATION_PUB = 3,
    FRIENDLOCATION_PRIVHIDE = 4,
    FRIENDLOCATION_PRIVSHOW = 5
}

export enum BNetClanRank {
    CLANRANK_INITIATE = 0,
    CLANRANK_PEON = 1,
    CLANRANK_GRUNT = 2,
    CLANRANK_SHAMAN = 3,
    CLANRANK_CHIEFTAN = 4
}

export enum BNetChatEventID {
    EID_SHOWUSER = 1,	// received when you join a channel (includes users in the channel and their information)
    EID_JOIN = 2,	// received when someone joins the channel you're currently in
    EID_LEAVE = 3,	// received when someone leaves the channel you're currently in
    EID_WHISPER = 4,	// received a whisper message
    EID_TALK = 5,	// received when someone talks in the channel you're currently in
    EID_BROADCAST = 6,	// server broadcast
    EID_CHANNEL = 7,	// received when you join a channel (includes the channel's name, flags)
    EID_USERFLAGS = 9,	// user flags updates
    EID_WHISPERSENT = 10,	// sent a whisper message
    EID_CHANNELFULL = 13,	// channel is full
    EID_CHANNELDOESNOTEXIST = 14,	// channel does not exist
    EID_CHANNELRESTRICTED = 15,	// channel is restricted
    EID_INFO = 18,	// broadcast/information message
    EID_ERROR = 19,	// error message
    EID_EMOTE = 23,	// emote
}

export enum BNetSID {
    SID_AUTH_INFO = 0x50,
    SID_PING = 0x25,
    SID_AUTH_CHECK = 0x51,
    SID_REQUIREDWORK = 0x4c,
    SID_AUTH_ACCOUNTLOGON = 0x53,
    SID_AUTH_ACCOUNTLOGONPROOF = 0x54,
    SID_NULL = 0x00,
    SID_NETGAMEPORT = 0x45,
    SID_ENTERCHAT = 0x0a,
    SID_JOINCHANNEL = 0x0c,
    SID_CHATEVENT = 0x0f,
    SID_CHATCOMMAND = 0x0e,
    SID_CLANINFO = 0x75,
    SID_CLANMEMBERLIST = 0x7d,
    SID_CLANMEMBERSTATUSCHANGE = 0x7f,
    SID_MESSAGEBOX = 0x19,
    SID_CLANINVITATION = 0x77,
    SID_CLANMEMBERREMOVED = 0x7e,
    SID_FRIENDSUPDATE = 0x66,
    SID_FRIENDSLIST = 0x65,
    SID_FLOODDETECTED = 0x13,
    SID_FRIENDSADD = 0x67,

    SID_GETADVLISTEX = 0x09,
    SID_STOPADV = 0x2,	// 0x2
    SID_CHECKAD = 0x15,	// 0x15
    SID_STARTADVEX3 = 0x1c,	// 0x1C
    SID_DISPLAYAD = 0x21,	// 0x21
    SID_NOTIFYJOIN = 0x22,	// 0x22
    SID_LOGONRESPONSE = 0x29,	// 0x29
}

export const BNET_HEADER_CONSTANT = 0xff;
export const BNET_INITIALIZE_SELECTOR = 0x01;

export class BNetProtocol extends Protocol {
    // SID_AUTH_INFO = 0x50;
    // SID_PING = 0x25;
    // SID_AUTH_CHECK = 0x51;
    // SID_REQUIREDWORK = 0x4c;
    // SID_AUTH_ACCOUNTLOGON = 0x53;
    // SID_AUTH_ACCOUNTLOGONPROOF = 0x54;
    // SID_NULL = 0x00;
    // SID_NETGAMEPORT = 0x45;
    // SID_ENTERCHAT = 0x0a;
    // SID_JOINCHANNEL = 0x0c;
    // SID_CHATEVENT = 0x0f;
    // SID_CHATCOMMAND = 0x0e;
    // SID_CLANINFO = 0x75;
    // SID_CLANMEMBERLIST = 0x7d;
    // SID_CLANMEMBERSTATUSCHANGE = 0x7f;
    // SID_MESSAGEBOX = 0x19;
    // SID_CLANINVITATION = 0x77;
    // SID_CLANMEMBERREMOVED = 0x7e;
    // SID_FRIENDSUPDATE = 0x66;
    // SID_FRIENDSLIST = 0x65;
    // SID_FLOODDETECTED = 0x13;
    // SID_FRIENDSADD = 0x67;
    //
    // SID_GETADVLISTEX = 0x09;
    // SID_STOPADV = 0x2;	// 0x2
    // SID_CHECKAD = 0x15;	// 0x15
    // SID_STARTADVEX3 = 0x1c;	// 0x1C
    // SID_DISPLAYAD = 0x21;	// 0x21
    // SID_NOTIFYJOIN = 0x22;	// 0x22
    // SID_LOGONRESPONSE = 0x29;	// 0x29

    // KR_GOOD = '\x00\x00\x00\x00';
    // KR_OLD_GAME_VERSION = '\x00\x01\x00\x00';
    // KR_INVALID_VERSION = '\x01\x01\x00\x00';
    // KR_ROC_KEY_IN_USE = '\x01\x02\x00\x00';
    // KR_TFT_KEY_IN_USE = '\x11\x02\x00\x00';

    NULL = [0]; // '\x00';
    NULL_2 = [0, 0]; // '\x00\x00';
    NULL_3 = [0, 0, 0]; // '\x00\x00\x00';
    NULL_4 = [0, 0, 0, 0]; // '\x00\x00\x00\x00';

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

    // EID_SHOWUSER = 1;	// received when you join a channel (includes users in the channel and their information)
    // EID_JOIN = 2;	// received when someone joins the channel you're currently in
    // EID_LEAVE = 3;	// received when someone leaves the channel you're currently in
    // EID_WHISPER = 4;	// received a whisper message
    // EID_TALK = 5;	// received when someone talks in the channel you're currently in
    // EID_BROADCAST = 6;	// server broadcast
    // EID_CHANNEL = 7;	// received when you join a channel (includes the channel's name, flags)
    // EID_USERFLAGS = 9;	// user flags updates
    // EID_WHISPERSENT = 10;	// sent a whisper message
    // EID_CHANNELFULL = 13;	// channel is full
    // EID_CHANNELDOESNOTEXIST = 14;	// channel does not exist
    // EID_CHANNELRESTRICTED = 15;	// channel is restricted
    // EID_INFO = 18;	// broadcast/information message
    // EID_ERROR = 19;	// error message
    // EID_EMOTE = 23;	// emote

    // CLANRANK_INITIATE = 0;
    // CLANRANK_PEON = 1;
    // CLANRANK_GRUNT = 2;
    // CLANRANK_SHAMAN = 3;
    // CLANRANK_CHIEFTAN = 4;

    // Bitfield
    // FRIENDSTATUS_MUTUAL = 1;
    // FRIENDSTATUS_DND = 2;
    // FRIENDSTATUS_AWAY = 4;

    // // Value
    // FRIENDLOCATION_OFFLINE = 0;
    // FRIENDLOCATION_NOTCHAT = 1;
    // FRIENDLOCATION_CHAT = 2;
    // FRIENDLOCATION_PUB = 3;
    // FRIENDLOCATION_PRIVHIDE = 4;
    // FRIENDLOCATION_PRIVSHOW = 5;

    PRODUCT_TFT = 'PX3W';
    PRODUCT_ROC = '3RAW';
    PLATFORM_X86 = '68XI';

    receivers = {
        [BNetSID.SID_PING]: this.RECEIVE_SID_PING,
        [BNetSID.SID_AUTH_INFO]: this.RECEIVE_SID_AUTH_INFO,
        [BNetSID.SID_AUTH_CHECK]: this.RECEIVE_SID_AUTH_CHECK,
        [BNetSID.SID_AUTH_ACCOUNTLOGON]: this.RECEIVE_SID_AUTH_ACCOUNTLOGON,
        [BNetSID.SID_AUTH_ACCOUNTLOGONPROOF]: this.RECEIVE_SID_AUTH_ACCOUNTLOGONPROOF,
        [BNetSID.SID_REQUIREDWORK]: this.RECEIVE_SID_REQUIREDWORK,
        [BNetSID.SID_NULL]: this.RECEIVE_SID_NULL,
        [BNetSID.SID_ENTERCHAT]: this.RECEIVE_SID_ENTERCHAT,
        [BNetSID.SID_CHATEVENT]: this.RECEIVE_SID_CHATEVENT,
        [BNetSID.SID_CLANINFO]: this.RECEIVE_SID_CLANINFO,
        [BNetSID.SID_CLANMEMBERLIST]: this.RECEIVE_SID_CLANMEMBERLIST,
        [BNetSID.SID_CLANMEMBERSTATUSCHANGE]: this.RECEIVE_SID_CLANMEMBERSTATUSCHANGE,
        [BNetSID.SID_MESSAGEBOX]: this.RECEIVE_SID_MESSAGEBOX,
        [BNetSID.SID_CLANINVITATION]: this.RECEIVE_SID_CLANINVITATION,
        [BNetSID.SID_CLANMEMBERREMOVED]: this.RECEIVE_SID_CLANMEMBERREMOVED,
        [BNetSID.SID_FRIENDSUPDATE]: this.RECEIVE_SID_FRIENDSUPDATE,
        [BNetSID.SID_FRIENDSLIST]: this.RECEIVE_SID_FRIENDSLIST,
        [BNetSID.SID_FLOODDETECTED]: this.RECEIVE_SID_FLOODDETECTED,
        [BNetSID.SID_FRIENDSADD]: this.RECEIVE_SID_FRIENDSADD,
        [BNetSID.SID_GETADVLISTEX]: this.RECEIVE_SID_GETADVLISTEX,
    };

    constructor(private readonly bnet: BNetConnection) {
        super();
    }

    /**
     * Basic function for construct packets for hosted game
     * @param id Packet type
     * @param args Packet data
     * @returns {Buffer}
     */
    asPacket(id, ...args) {
        return this.buffer(
            BNET_HEADER_CONSTANT,
            id,
            ...args
        );
    }

    /**
     * Checks if given buffer a BNet Packet
     * @param {Buffer} buffer
     * @returns {Boolean}
     */
    haveHeader(buffer: Buffer) {
        return buffer[0] === BNET_HEADER_CONSTANT; //String.fromCharCode(buffer[0])
    }

    RECEIVE_SID_NULL(buff: Buffer) {
        debug('RECEIVE_SID_NULL');
        return ValidateLength(buff);
    }

    RECEIVE_SID_REQUIREDWORK(buff: Buffer) {
        debug('RECEIVE_SID_REQUIREDWORK');
        return ValidateLength(buff);
    }

    RECEIVE_SID_CLANINFO(buff: Buffer) {
        debug('RECEIVE_SID_CLANINFO');
        return ValidateLength(buff);
    }

    RECEIVE_SID_MESSAGEBOX(buff: Buffer) {
        debug('RECEIVE_SID_MESSAGEBOX');
        return ValidateLength(buff);
    }

    RECEIVE_SID_CLANINVITATION(buff: Buffer) {
        debug('RECEIVE_SID_CLANINVITATION');
        return ValidateLength(buff);
    }

    RECEIVE_SID_CLANMEMBERREMOVED(buff: Buffer) {
        debug('RECEIVE_SID_CLANMEMBERREMOVED');
        return ValidateLength(buff);
    }

    RECEIVE_SID_FRIENDSUPDATE(buff: Buffer) {
        debug('RECEIVE_SID_FRIENDSUPDATE');
        return ValidateLength(buff);
    }

    RECEIVE_SID_FLOODDETECTED(buff: Buffer) {
        debug('RECEIVE_SID_FLOODDETECTED');
        return ValidateLength(buff);
    }

    RECEIVE_SID_FRIENDSADD(buff: Buffer) {
        debug('RECEIVE_SID_FRIENDSADD');
        return ValidateLength(buff);
    }

    RECEIVE_SID_GETADVLISTEX(buff: Buffer) {
        debug('RECEIVE_SID_GETADVLISTEX');
        return new SIDGetAdvListEx(buff);
    }

    RECEIVE_SID_ENTERCHAT(buff: Buffer): Buffer {
        debug('RECEIVE_SID_ENTERCHAT');
        assert(ValidateLength(buff) && buff.length >= 5);
        return buff.slice(4);
    }

    RECEIVE_SID_CHATEVENT(buff: Buffer): IncomingChatEvent {
        debug('RECEIVE_SID_CHATEVENT');
        return new IncomingChatEvent(buff);
    }

    RECEIVE_SID_CHECKAD(buff: Buffer): boolean {
        debug('RECEIVE_SID_CHECKAD');
        // DEBUG_Print( "RECEIVED SID_CHECKAD" );
        // DEBUG_Print( data );

        // 2 bytes					-> Header
        // 2 bytes					-> Length
        return ValidateLength(buff);
    }

    RECEIVE_SID_STARTADVEX3(buff: Buffer): boolean {
        debug('RECEIVE_SID_STARTADVEX3');
        // DEBUG_Print( "RECEIVED SID_STARTADVEX3" );
        // DEBUG_Print( data );

        // 2 bytes					-> Header
        // 2 bytes					-> Length
        // 4 bytes					-> Status

        // if( ValidateLength( data ) && data.size( ) >= 8 )
        // {
        //     BYTEARRAY Status = BYTEARRAY( data.begin( ) + 4, data.begin( ) + 8 );
        //
        //     if( UTIL_ByteArrayToUInt32( Status, false ) == 0 )
        //         return true;
        // }
        return false;
    }

    RECEIVE_SID_PING(buff: Buffer): Buffer {
        debug('RECEIVE_SID_PING');
        assert(buff.length >= 8);

        return buff.slice(4, 8); // bytes(p[4:8])
    }

    RECEIVE_SID_LOGONRESPONSE(buff: Buffer) {
        debug('RECEIVE_SID_LOGONRESPONSE');

        // DEBUG_Print( "RECEIVED SID_LOGONRESPONSE" );
        // DEBUG_Print( data );

        // 2 bytes					-> Header
        // 2 bytes					-> Length
        // 4 bytes					-> Status

        // if( ValidateLength( data ) && data.size( ) >= 8 )
        // {
        //     BYTEARRAY Status = BYTEARRAY( data.begin( ) + 4, data.begin( ) + 8 );
        //
        //     if( UTIL_ByteArrayToUInt32( Status, false ) == 1 )
        //         return true;
        // }

        return false;
    }

    RECEIVE_SID_AUTH_INFO(buff: Buffer): AuthInfo {
        debug('RECEIVE_SID_AUTH_INFO');
        return new AuthInfo(buff);
    };

    RECEIVE_SID_AUTH_CHECK(buff: Buffer): AuthState {
        debug('RECEIVE_SID_AUTH_CHECK');
        return new AuthState(buff);
    };

    RECEIVE_SID_AUTH_ACCOUNTLOGON(buff: Buffer): AccountLogon {
        debug('RECEIVE_SID_AUTH_ACCOUNTLOGON');
        return new AccountLogon(buff);
    }

    RECEIVE_SID_AUTH_ACCOUNTLOGONPROOF(buff: Buffer): AccountLogonProof {
        debug('RECEIVE_SID_AUTH_ACCOUNTLOGONPROOF');
        return new AccountLogonProof(buff);
    }

    RECEIVE_SID_WARDEN(buff: Buffer): Buffer {
        debug('RECEIVE_SID_WARDEN');

        // DEBUG_Print( "RECEIVED SID_WARDEN" );
        // DEBUG_PRINT( data );

        // 2 bytes					-> Header
        // 2 bytes					-> Length
        // n bytes					-> Data

        if (ValidateLength(buff) && buff.length >= 4)
            return buff.slice(4);

        return ByteArray([]);
    }

    RECEIVE_SID_FRIENDSLIST(buff: Buffer): FriendList {
        debug('RECEIVE_SID_FRIENDSLIST');
        return new FriendList(buff);
    }

    RECEIVE_SID_CLANMEMBERLIST(buff: Buffer) {
        debug('RECEIVE_SID_CLANMEMBERLIST');
        return new ClanMemberList(buff);
    }

    RECEIVE_SID_CLANMEMBERSTATUSCHANGE(buff: Buffer) {
        debug('RECEIVE_SID_CLANMEMBERSTATUSCHANGE');

        return new IncomingClanList(buff);
    }

    SEND_PROTOCOL_INITIALIZE_SELECTOR() {
        debug('SEND_PROTOCOL_INITIALIZE_SELECTOR');

        return Buffer.from([BNET_INITIALIZE_SELECTOR]);
    }

    SEND_SID_NULL() {
        return this.asPacket([BNetSID.SID_NULL]);
    }

    SEND_SID_STOPADV() {
    }

    SEND_SID_GETADVLISTEX(gameName: string, numGames: number = 0) {
        // unsigned char MapFilter1[]	= { 255, 3, 0, 0 };
        // unsigned char MapFilter2[]	= { 255, 3, 0, 0 };
        // unsigned char MapFilter3[]	= {   0, 0, 0, 0 };
        // unsigned char NumGames[]	= {   1, 0, 0, 0 };
        //
        // BYTEARRAY packet;
        // packet.push_back( BNET_HEADER_CONSTANT );			// BNET header constant
        // packet.push_back( SID_GETADVLISTEX );				// SID_GETADVLISTEX
        // packet.push_back( 0 );								// packet length will be assigned later
        // packet.push_back( 0 );								// packet length will be assigned later
        // UTIL_AppendByteArray( packet, MapFilter1, 4 );		// Map Filter
        // UTIL_AppendByteArray( packet, MapFilter2, 4 );		// Map Filter
        // UTIL_AppendByteArray( packet, MapFilter3, 4 );		// Map Filter
        // UTIL_AppendByteArray( packet, NumGames, 4 );		// maximum number of games to list
        // UTIL_AppendByteArrayFast( packet, gameName );		// Game Name
        // packet.push_back( 0 );								// Game Password is NULL
        // packet.push_back( 0 );								// Game Stats is NULL
        // AssignLength( packet );
        // // DEBUG_Print( "SENT SID_GETADVLISTEX" );
        // // DEBUG_Print( packet );
        // return packet;

        let cond1 = [0, 0];
        let cond2 = [0, 0];
        let cond3 = [0, 0, 0, 0];
        let cond4 = [0, 0, 0, 0];

        if (!gameName.length) {
            cond1[0] = 0;
            cond1[1] = 224;

            cond2[0] = 127;
            cond2[1] = 0;
        } else {
            cond1 = [255, 3];
            cond2 = [0, 0];
            cond3 = [255, 3, 0, 0];
            numGames = 1;
        }

        return this.asPacket(
            BNetSID.SID_GETADVLISTEX,
            cond1,
            cond2,
            cond3,
            cond4,
            ByteUInt32(1),
            ByteString(gameName),
            this.NULL, // Game Password is NULL
            this.NULL // Game Stats is NULL
        );
    }

    SEND_SID_ENTERCHAT() {
        return this.asPacket(
            BNetSID.SID_ENTERCHAT,
            this.NULL, //Account Name is NULL on Warcraft III/The Frozen Throne
            this.NULL //Stat String is NULL on CDKEY'd products
        );
    }

    SEND_SID_JOINCHANNEL(channel: string) {
        const noCreateJoin = '\x02\x00\x00\x00';
        const firstJoin = '\x01\x00\x00\x00';

        return this.asPacket(
            BNetSID.SID_JOINCHANNEL,
            channel.length > 0 ? noCreateJoin : firstJoin,
            ByteString(channel)
        );
    }

    SEND_SID_CHATCOMMAND(command: string) {
        return this.asPacket(
            BNetSID.SID_CHATCOMMAND,
            ByteString(command)
        );
    }

    SEND_SID_CHECKAD() {
    }

    SEND_SID_PING(payload) {
        debug('SEND_SID_PING');
        assert(payload.length === 4, 'invalid parameters passed to SEND_SID_PING');

        return this.asPacket(
            BNetSID.SID_PING,
            payload
        );
    }

    SEND_SID_AUTH_INFO(version, TFT, localeID, countryAbbrev, country, lang) {
        debug('SEND_SID_AUTH_INFO');

        // (DWORD)		 Protocol ID (0)
        // (DWORD)		 Platform ID
        // (DWORD)		 Product ID
        // (DWORD)		 Version Byte
        // (DWORD)		 Product language
        // (DWORD)		 Local IP for NAT compatibility*
        // (DWORD)		 Time zone bias*
        // (DWORD)		 Locale ID*
        // (DWORD)		 Language ID*
        // (STRING) 	 Country abreviation
        // (STRING) 	 Country

        const protocolID = this.NULL_4;
        const language = lang.split('').reverse().join(''); //[83, 85, 110, 101]; // "enUS"
        const IP = localIP().split('.').map(Number); //[127, 0, 0, 1];

        return this.asPacket(
            BNetSID.SID_AUTH_INFO,
            protocolID,
            this.PLATFORM_X86,
            TFT ? this.PRODUCT_TFT : this.PRODUCT_ROC,
            ByteUInt32(version),
            language,
            IP,
            ByteUInt32(getTimezone()), //time zone bias
            ByteUInt32(localeID),
            ByteUInt32(localeID),
            ByteString(countryAbbrev),
            ByteString(country)
        );
    }

    SEND_SID_AUTH_CHECK(tft, clientToken, exeVersion, exeVersionHash, keyInfoRoc, keyInfoTft, exeInfo, keyOwnerName) {
        const numKeys = (tft) ? 2 : 1;

        return this.asPacket(
            BNetSID.SID_AUTH_CHECK,
            clientToken,
            exeVersion,
            exeVersionHash,
            [numKeys, 0, 0, 0],
            this.NULL_4,
            keyInfoRoc,
            tft ? keyInfoTft : false, //if it false, its excluded
            ByteString(exeInfo),
            ByteString(keyOwnerName)
        );
    }

    SEND_SID_AUTH_ACCOUNTLOGON(clientPublicKey, accountName) {
        assert(clientPublicKey.length === 32, 'public key length error');

        return this.asPacket(
            BNetSID.SID_AUTH_ACCOUNTLOGON,
            clientPublicKey,
            ByteString(accountName)
        );
    }

    SEND_SID_AUTH_ACCOUNTLOGONPROOF(M1) {
        assert(M1.length === 20, 'password length error');

        return this.asPacket(
            BNetSID.SID_AUTH_ACCOUNTLOGONPROOF,
            M1
        );
    }

    SEND_SID_NETGAMEPORT(serverPort) {
        return this.asPacket(
            BNetSID.SID_NETGAMEPORT,
            ByteUInt32(serverPort)
        );
    }

    SEND_SID_FRIENDSLIST() {
        return this.asPacket(
            BNetSID.SID_FRIENDSLIST
        );
    }

    SEND_SID_CLANMEMBERLIST() {
        const cookie = this.NULL_4;

        return this.asPacket(
            BNetSID.SID_CLANMEMBERLIST,
            cookie
        );
    }

    SEND_SID_NOTIFYJOIN(gameName: string) {

    }
}
