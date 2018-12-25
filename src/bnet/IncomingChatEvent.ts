import {BNetChatEventID} from "./BNetChatEventID"
import * as assert from "assert";
import {ByteExtractString, ValidateLength} from "../Bytes";

export class IncomingChatEvent {
    public readonly ping: number;
    public readonly id: number;
    public readonly user: string;
    public readonly message: string;

    constructor(buff: Buffer) {
        assert(ValidateLength(buff) && buff.length >= 29, 'RECEIVE_SID_CHATEVENT');

        // 2 bytes					-> Header
        // 2 bytes					-> Length
        // 4 bytes					-> EventID
        // 4 bytes					-> ???
        // 4 bytes					-> Ping
        // 12 bytes					-> ???
        // null terminated string	-> User
        // null terminated string	-> Message

        this.id = buff.readInt32LE(4);
        this.ping = buff.readInt32LE(12);
        this.user = ByteExtractString(buff.slice(28));
        this.message = ByteExtractString(buff.slice(29 + this.user.length));
    }

    /**
     * @returns {String}
     * @constructor
     */
    idType() {
        return {
            [BNetChatEventID.EID_SHOWUSER]: 'SHOWUSER',
            [BNetChatEventID.EID_JOIN]: 'JOIN',
            [BNetChatEventID.EID_LEAVE]: 'LEAVE',
            [BNetChatEventID.EID_WHISPER]: 'WHISPER',
            [BNetChatEventID.EID_TALK]: 'TALK',
            [BNetChatEventID.EID_BROADCAST]: 'BROADCAST',
            [BNetChatEventID.EID_CHANNEL]: 'CHANNEL',
            [BNetChatEventID.EID_USERFLAGS]: 'USERFLAGS',
            [BNetChatEventID.EID_WHISPERSENT]: 'WHISPERSENT',
            [BNetChatEventID.EID_CHANNELFULL]: 'CHANNELFULL',
            [BNetChatEventID.EID_CHANNELDOESNOTEXIST]: 'CHANNELDOESNOTEXIST',
            [BNetChatEventID.EID_CHANNELRESTRICTED]: 'CHANNELRESTRICTED',
            [BNetChatEventID.EID_INFO]: 'INFO',
            [BNetChatEventID.EID_ERROR]: 'ERROR',
            [BNetChatEventID.EID_EMOTE]: 'EMOTE',
        }[this.id];
    }

    isUserFlags(): boolean {
        return this.id === BNetChatEventID.EID_USERFLAGS;
    }

    isShowUser(): boolean {
        return this.id === BNetChatEventID.EID_SHOWUSER;
    }

    isJoin(): boolean {
        return this.id === BNetChatEventID.EID_JOIN;
    }

    isLeave(): boolean {
        return this.id === BNetChatEventID.EID_LEAVE;
    }

    isWhisper(): boolean {
        return this.id === BNetChatEventID.EID_WHISPER;
    }

    isTalk(): boolean {
        return this.id === BNetChatEventID.EID_TALK;
    }

    isError(): boolean {
        return this.id === BNetChatEventID.EID_ERROR;
    }

    isInfo(): boolean {
        return this.id === BNetChatEventID.EID_INFO;
    }

    isEmote(): boolean {
        return this.id === BNetChatEventID.EID_EMOTE;
    }
}
