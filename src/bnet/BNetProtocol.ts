import * as assert from 'assert';
import {localIP, getTimezone} from '../util';
import {ValidateLength, ByteUInt32, ByteString, ByteExtractString, ByteExtractUInt32, ByteArray} from '../Bytes';
import {Protocol} from '../Protocol';

import {createLoggerFor, hex} from '../Logger';
import {BNetConnection} from "./BNetConnection";
import {BNetSID} from "./BNetSID";
import {IBNetProtocol} from "./IBNetProtocol";

const {debug, info, error} = createLoggerFor('BNetProtocol');

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

export const BNET_HEADER_CONSTANT = 0xff;
export const BNET_INITIALIZE_SELECTOR = 0x01;

export class BNetProtocol extends Protocol implements IBNetProtocol {
    NULL = [0]; // '\x00';
    NULL_2 = [0, 0]; // '\x00\x00';
    NULL_3 = [0, 0, 0]; // '\x00\x00\x00';
    NULL_4 = [0, 0, 0, 0]; // '\x00\x00\x00\x00';

    PRODUCT_TFT = 'PX3W';
    PRODUCT_ROC = '3RAW';
    PLATFORM_X86 = '68XI';

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
