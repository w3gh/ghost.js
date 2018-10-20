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
        switch (this.id) {
            case BNetChatEventID.EID_SHOWUSER:
                return 'SHOWUSER';
            case BNetChatEventID.EID_JOIN:
                return 'JOIN';
            case BNetChatEventID.EID_LEAVE:
                return 'LEAVE';
            case BNetChatEventID.EID_WHISPER:
                return 'WHISPER';
            case BNetChatEventID.EID_TALK:
                return 'TALK';
            case BNetChatEventID.EID_BROADCAST:
                return 'BROADCAST';
            case BNetChatEventID.EID_CHANNEL:
                return 'CHANNEL';
            case BNetChatEventID.EID_USERFLAGS:
                return 'USERFLAGS';
            case BNetChatEventID.EID_WHISPERSENT:
                return 'WHISPERSENT';
            case BNetChatEventID.EID_CHANNELFULL:
                return 'CHANNELFULL';
            case BNetChatEventID.EID_CHANNELDOESNOTEXIST:
                return 'CHANNELDOESNOTEXIST';
            case BNetChatEventID.EID_CHANNELRESTRICTED:
                return 'CHANNELRESTRICTED';
            case BNetChatEventID.EID_INFO:
                return 'INFO';
            case BNetChatEventID.EID_ERROR:
                return 'ERROR';
            case BNetChatEventID.EID_EMOTE:
                return 'EMOTE';
        }
    }

    isUserFlags(): boolean {
        return this.idType() === 'USERFLAGS';
    }

    isShowUser(): boolean {
        return this.idType() === 'SHOWUSER';
    }

    isJoin(): boolean {
        return this.idType() === 'JOIN';
    }

    isLeave(): boolean {
        return this.idType() === 'LEAVE';
    }

    isWhisper(): boolean {
        return this.idType() === 'WHISPER';
    }

    isTalk(): boolean {
        return this.idType() === 'TALK';
    }

    isError(): boolean {
        return this.idType() === 'ERROR';
    }

    isInfo(): boolean {
        return this.idType() === 'INFO';
    }

    isEmote(): boolean {
        return this.idType() === 'EMOTE';
    }
}
