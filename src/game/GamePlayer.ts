'use strict';

import {PotentialPlayer} from './PotentialPlayer';
import {Queue} from "../Queue";
import { BaseGame } from './BaseGame';
import {GameProtocol, W3GSPacket} from './GameProtocol';

export class GamePlayer extends PotentialPlayer {
    private pings: number[];					// store the last few (20) pings received so we can take an average
    private checkSums: Queue<number>;				// the last few checksums the player has sent (for detecting desyncs)
    private leftReason: string;						// the reason the player left the game
    private spoofedRealm: string;						// the realm the player last spoof checked on
    // private joinedRealm: string;						// the realm the player joined on (probable, can be spoofed)
    private totalPacketsSent: number;
    private totalPacketsReceived: number;
    private leftCode: number;						// the code to be sent in W3GS_PLAYERLEAVE_OTHERS for why this player left the game
    private loginAttempts: number;					// the number of attempts to login (used with CAdminGame only)
    private syncCounter: number;						// the number of keepalive packets received from this player
    private joinTime: number;						// GetTime when the player joined the game (used to delay sending the /whois a few seconds to allow for some lag)
    private lastMapPartSent: number;					// the last mappart sent to the player (for sending more than one part at a time)
    private lastMapPartAcked: number;				// the last mappart acknowledged by the player
    private startedDownloadingTicks: number;			// GetTicks when the player started downloading the map
    private finishedDownloadingTime: number;			// GetTime when the player finished downloading the map
    private finishedLoadingTicks: number;			// GetTicks when the player finished loading the game
    private startedLaggingTicks: number;				// GetTicks when the player started lagging
    private statsSentTime: number;					// GetTime when we sent this player's stats to the chat (to prevent players from spamming !stats)
    private statsDotASentTime: number;				// GetTime when we sent this player's dota stats to the chat (to prevent players from spamming !statsdota)
    private lastGProxyWaitNoticeSentTime: number;
    private loadInGameData: Queue<Buffer>;			// queued data to be sent when the player finishes loading when using "load in game"
    private score: number; // float								// the player's generic "score" for the matchmaking algorithm
    private isLoggedIn: boolean;							// if the player has logged in or not (used with CAdminGame only)
    private isSpoofed: boolean;								// if the player has spoof checked or not
    // private isReserved: boolean;							// if the player is reserved (VIP) or not
    private isWhoisShouldBeSent: boolean;					// if a battle.net /whois should be sent for this player or not
    private isWhoisSent: boolean;							// if we've sent a battle.net /whois for this player yet (for spoof checking)
    private isDownloadAllowed: boolean;						// if we're allowed to download the map or not (used with permission based map downloads)
    private isDownloadStarted: boolean;						// if we've started downloading the map or not
    private isDownloadFinished: boolean;					// if we've finished downloading the map or not
    private isFinishedLoading: boolean;						// if the player has finished loading or not
    private isLagging: boolean;								// if the player is lagging or not (on the lag screen)
    private isDropVote: boolean;							// if the player voted to drop the laggers or not (on the lag screen)
    private isKickVote: boolean;							// if the player voted to kick a player or not
    private isMuted: boolean;								// if the player is muted or not
    private isLeftMessageSent: boolean;						// if the playerleave message has been sent or not
    private isGProxy: boolean;								// if the player is using GProxy++
    private isGProxyDisconnectNoticeSent: boolean;			// if a disconnection notice has been sent or not when using GProxy++
    private gproxyBuffer: Queue<Buffer>;
    private gproxyReconnectKey: number;
    private lastGProxyAckTime: number;


    // @TODO: add PID, nJoinedRealm, string nName, BYTEARRAY nInternalIP, bool nReserved
    // CGamePlayer( , unsigned char nPID, string nJoinedRealm, string nName, BYTEARRAY nInternalIP, bool nReserved );
    constructor(protocol: GameProtocol, game: BaseGame, socketId: number, public PID: number, public joinedRealm: string, public name: string, public internalIP: Buffer, public isReserved: boolean) {
        super(protocol, game, socketId);

        this.isLeftMessageSent = false;
    }

    // @TODO: implement construct from PotentialPlayer instance
    static fromPotentialPlayer(potential: PotentialPlayer, PID: number, joinedRealm: string, name: string, internalIP: Buffer, isReserved: boolean) {
        return new GamePlayer(potential.protocol, potential.game, potential.socketId, PID, joinedRealm, name, internalIP, isReserved);
    }

    [W3GSPacket.W3GS_LEAVEGAME] = () => {
        this.debug('W3GS_LEAVEGAME')
    };
    [W3GSPacket.W3GS_GAMELOADED_SELF] = () => {
        this.debug('W3GS_GAMELOADED_SELF')
    };
    [W3GSPacket.W3GS_OUTGOING_ACTION] = () => {
        this.debug('W3GS_OUTGOING_ACTION')
    };
    [W3GSPacket.W3GS_OUTGOING_KEEPALIVE] = () => {
        this.debug('W3GS_OUTGOING_KEEPALIVE')
    };
    [W3GSPacket.W3GS_CHAT_TO_HOST] = () => {
        this.debug('W3GS_CHAT_TO_HOST')
    };
    [W3GSPacket.W3GS_DROPREQ] = () => {
        this.debug('W3GS_DROPREQ')
    };
    [W3GSPacket.W3GS_PONG_TO_HOST] = () => {
        this.debug('W3GS_MAPSIZE')
    };

    getIsLeftMessageSent() {
        return this.isLeftMessageSent;
    }

    getPID() {
        return this.PID
    }

    getName() {
        return this.name
    }

    getLeftCode(): number {
        return this.leftCode
    }

    setSpoofed(value: boolean) {
        this.isSpoofed = value;

        return this
    }

    setLeftReason(reason: string) {
        // @TODO: implement
        return this
    }

    setLeftMessageSent(value: boolean) {
        // @TODO: implement
        return this
    }

    setLeftCode(code: number) {
        // @TODO: implement
        return this
    }
}
