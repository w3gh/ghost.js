import {BNetProtocol} from './BNetProtocol';

export class IncomingChatEvent {
    /**
     * @param {Number} id
     * @param {Number} ping
     * @param {String} user
     * @param {String} message
     * @param {BNetProtocol} protocol
     */
    constructor(public id: number,
                public ping: number,
                public user: string,
                public message: string,
                private protocol: BNetProtocol) {
    }

    /**
     * @returns {String}
     * @constructor
     */
    idType() {
        switch (this.id) {
            case this.protocol.EID_SHOWUSER:
                return 'SHOWUSER';
            case this.protocol.EID_JOIN:
                return 'JOIN';
            case this.protocol.EID_LEAVE:
                return 'LEAVE';
            case this.protocol.EID_WHISPER:
                return 'WHISPER';
            case this.protocol.EID_TALK:
                return 'TALK';
            case this.protocol.EID_BROADCAST:
                return 'BROADCAST';
            case this.protocol.EID_CHANNEL:
                return 'CHANNEL';
            case this.protocol.EID_USERFLAGS:
                return 'USERFLAGS';
            case this.protocol.EID_WHISPERSENT:
                return 'WHISPERSENT';
            case this.protocol.EID_CHANNELFULL:
                return 'CHANNELFULL';
            case this.protocol.EID_CHANNELDOESNOTEXIST:
                return 'CHANNELDOESNOTEXIST';
            case this.protocol.EID_CHANNELRESTRICTED:
                return 'CHANNELRESTRICTED';
            case this.protocol.EID_INFO:
                return 'INFO';
            case this.protocol.EID_ERROR:
                return 'ERROR';
            case this.protocol.EID_EMOTE:
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
