import * as assert from 'assert';
import {BNetSID} from "../../bnet/BNetSID";

import {IncomingChatEvent} from "../../bnet/IncomingChatEvent";
import {AccountLogonProof} from "../../bnet/AccountLogonProof";
import {SIDGetAdvListEx} from "../../bnet/SIDGetAdvListEx";
import {AuthInfo} from "../../bnet/AuthInfo";
import {AuthState} from "../../bnet/AuthState";
import {AccountLogon} from "../../bnet/AccountLogon";
import {FriendList} from "../../bnet/FriendList";
import {ClanMemberList} from "../../bnet/ClanMemberList";
import {IncomingClanList} from "../../bnet/IncomingClanList";
import {ValidateLength, ByteUInt32, ByteString, ByteExtractString, ByteExtractUInt32, ByteArray} from '../../Bytes';
import {create} from "../../Logger";

const {debug, info, error} = create('BNet_SID_Receiver');

export class GhostBNetSIDReceiver {

    [BNetSID.SID_NULL](buff: Buffer) {
        debug('RECEIVE_SID_NULL');
        return ValidateLength(buff);
    }

    [BNetSID.SID_REQUIREDWORK](buff: Buffer) {
        debug('RECEIVE_SID_REQUIREDWORK');
        return ValidateLength(buff);
    }

    [BNetSID.SID_CLANINFO](buff: Buffer) {
        debug('RECEIVE_SID_CLANINFO');
        return ValidateLength(buff);
    }

    [BNetSID.SID_MESSAGEBOX](buff: Buffer) {
        debug('RECEIVE_SID_MESSAGEBOX');
        return ValidateLength(buff);
    }

    [BNetSID.SID_CLANINVITATION](buff: Buffer) {
        debug('RECEIVE_SID_CLANINVITATION');
        return ValidateLength(buff);
    }

    [BNetSID.SID_CLANMEMBERREMOVED](buff: Buffer) {
        debug('RECEIVE_SID_CLANMEMBERREMOVED');
        return ValidateLength(buff);
    }

    [BNetSID.SID_FRIENDSUPDATE](buff: Buffer) {
        debug('RECEIVE_SID_FRIENDSUPDATE');
        return ValidateLength(buff);
    }

    [BNetSID.SID_FLOODDETECTED](buff: Buffer) {
        debug('RECEIVE_SID_FLOODDETECTED');
        return ValidateLength(buff);
    }

    [BNetSID.SID_FRIENDSADD](buff: Buffer) {
        debug('RECEIVE_SID_FRIENDSADD');
        return ValidateLength(buff);
    }

    [BNetSID.SID_GETADVLISTEX](buff: Buffer) {
        debug('RECEIVE_SID_GETADVLISTEX');
        return new SIDGetAdvListEx(buff);
    }

    [BNetSID.SID_ENTERCHAT](buff: Buffer): Buffer {
        debug('RECEIVE_SID_ENTERCHAT');
        assert(ValidateLength(buff) && buff.length >= 5);
        return buff.slice(4);
    }

    [BNetSID.SID_CHATEVENT](buff: Buffer): IncomingChatEvent {
        debug('RECEIVE_SID_CHATEVENT');
        return new IncomingChatEvent(buff);
    }

    [BNetSID.SID_CHECKAD](buff: Buffer): boolean {
        debug('RECEIVE_SID_CHECKAD');
        // DEBUG_Print( "RECEIVED SID_CHECKAD" );
        // DEBUG_Print( data );

        // 2 bytes					-> Header
        // 2 bytes					-> Length
        return ValidateLength(buff);
    }

    [BNetSID.SID_STARTADVEX3](buff: Buffer): boolean {
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

    [BNetSID.SID_PING](buff: Buffer): Buffer {
        debug('RECEIVE_SID_PING');
        assert(buff.length >= 8);

        return buff.slice(4, 8); // bytes(p[4:8])
    }

    [BNetSID.SID_LOGONRESPONSE](buff: Buffer) {
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

    [BNetSID.SID_AUTH_INFO](buff: Buffer): AuthInfo {
        debug('RECEIVE_SID_AUTH_INFO');
        return new AuthInfo(buff);
    };

    [BNetSID.SID_AUTH_CHECK](buff: Buffer): AuthState {
        debug('RECEIVE_SID_AUTH_CHECK');
        return new AuthState(buff);
    };

    [BNetSID.SID_AUTH_ACCOUNTLOGON](buff: Buffer): AccountLogon {
        debug('RECEIVE_SID_AUTH_ACCOUNTLOGON');
        return new AccountLogon(buff);
    }

    [BNetSID.SID_AUTH_ACCOUNTLOGONPROOF](buff: Buffer): AccountLogonProof {
        debug('RECEIVE_SID_AUTH_ACCOUNTLOGONPROOF');
        return new AccountLogonProof(buff);
    }

    [BNetSID.SID_WARDEN](buff: Buffer): Buffer {
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

    [BNetSID.SID_FRIENDSLIST](buff: Buffer): FriendList {
        debug('RECEIVE_SID_FRIENDSLIST');
        return new FriendList(buff);
    }

    [BNetSID.SID_CLANMEMBERLIST](buff: Buffer) {
        debug('RECEIVE_SID_CLANMEMBERLIST');
        return new ClanMemberList(buff);
    }

    [BNetSID.SID_CLANMEMBERSTATUSCHANGE](buff: Buffer) {
        debug('RECEIVE_SID_CLANMEMBERSTATUSCHANGE');

        return new IncomingClanList(buff);
    }
}