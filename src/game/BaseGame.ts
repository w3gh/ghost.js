import * as net from 'net';
import {ByteUInt32} from '../Bytes';
import {EventEmitter} from 'events';
import {GameProtocol} from './GameProtocol';
import {Map} from './Map';
import {GamePlayer} from './GamePlayer';
import {createLoggerFor, hex} from '../Logger';
import {PotentialPlayer} from "./PotentialPlayer";
import {GameSlot, MAX_SLOTS} from "./GameSlot";
import {GHost} from "../GHost";
import {getTicks} from "../util";
import { IncomingJoinPlayer } from './IncomingJoinPlayer';

const {debug, info, error} = createLoggerFor('BaseGame');

const GAME_REHOST_INTERVAL = 5000;

const GAME_SLOT_MAX = 255;

const GAME_NAME_MAX = 31;

export class BaseGame extends EventEmitter {
    static EVENT_PLAYER_JOINED = 'player.joined';

    private protocol: GameProtocol = new GameProtocol(this);
    private server: net.Server = net.createServer();
    private potentials: PotentialPlayer[] = [];
    private slots: GameSlot[] = [];
    private players: GamePlayer[] = [];
    private lastGameName: string;
    private countDownStarted: boolean = false;
    private lastPingTime: number = getTicks();
    private lastRefreshTime: number = getTicks();
    private creationTime: number = getTicks();
    private exiting: boolean = false;
    private saving: boolean = false;
    private virtualHostPID: number = GAME_SLOT_MAX;
    private randomSeed: number = getTicks();
    protected virtualHostName: string = 'Map';
    protected joinedRealm: string = '';
    public gameName: string = '';

    private fakePlayerPID: number = GAME_SLOT_MAX;

    constructor(public ghost: GHost,
                private hostCounter: number,
                public map: Map,
                public saveGame = null,
                public hostPort: number,
                public gameState: number,
                gameName: string,
                public ownerName: string,
                public creatorName = 'JiLiZART',
                public creatorServer: string = '') {
        super();

        this.slots = this.map.slots;

        this.lastGameName = gameName.substr(0 , GAME_NAME_MAX);
        this.gameName = this.lastGameName;

        this.socketServerSetup(hostPort);

        this.on(BaseGame.EVENT_PLAYER_JOINED, this.onPlayerJoined.bind(this));
    }

    /**
     * @param {PotentialPlayer} potentialPlayer
     * @param {IncomingJoinPlayer} joinPlayer
     */
    onPlayerJoined(potentialPlayer: PotentialPlayer, joinPlayer: IncomingJoinPlayer) {
        info('player joined');

        const infoPlayer = msg => info(`[GAME: ${this.gameName}] player [${joinPlayer.getName()}|${potentialPlayer.getExternalIP()}] ${msg}`);

        // check if the new player's name is empty or too long
        if (!joinPlayer.name.length || joinPlayer.name.length > 15) {
            infoPlayer(`is trying to join the game with an invalid name of length ${joinPlayer.getName().length}`);

            potentialPlayer.send(this.protocol.SEND_W3GS_REJECTJOIN(this.protocol.REJECTJOIN_FULL));
            potentialPlayer.setDeleteMe(true);
        }

        // check if the new player's name is the same as the virtual host name
        if (joinPlayer.name === this.virtualHostName) {
            infoPlayer(`is trying to join the game with the virtual host name`);
            potentialPlayer.send(this.protocol.SEND_W3GS_REJECTJOIN(this.protocol.REJECTJOIN_FULL));
            potentialPlayer.setDeleteMe(true);
            return null;
        }

        // check if the new player's name is already taken
        if (this.getPlayerFromName(joinPlayer.name, false)) {
            infoPlayer(`is trying to join the game but that name is already taken`);
            potentialPlayer.send(this.protocol.SEND_W3GS_REJECTJOIN(this.protocol.REJECTJOIN_FULL));
            potentialPlayer.setDeleteMe(true);
            return null;
        }

        // identify their joined realm
        // this is only possible because when we send a game refresh via LAN or battle.net we encode an ID value in the 4 most significant bits of the host counter
        // the client sends the host counter when it joins so we can extract the ID value here
        // note: this is not a replacement for spoof checking since it doesn't verify the player's name and it can be spoofed anyway

        const hostCounterID = joinPlayer.getHostCounter() >> 28;
        let joinedRealm = '';

        /**
         for( vector<CBNET *> :: iterator i = m_GHost->m_BNETs.begin( ); i != m_GHost->m_BNETs.end( ); ++i )
         {
            if( (*i)->GetHostCounterID( ) == HostCounterID )
                JoinedRealm = (*i)->GetServer( );
         }

             if( JoinedRealm.empty( ) )
             {
            // the player is pretending to join via LAN, which they might or might not be (i.e. it could be spoofed)
            // however, we've been broadcasting a random entry key to the LAN
            // if the player is really on the LAN they'll know the entry key, otherwise they won't
            // or they're very lucky since it's a 32 bit number

            if( joinPlayer->GetEntryKey( ) != m_EntryKey )
            {
                // oops!

                CONSOLE_Print( "[GAME: " + m_GameName + "] player [" + joinPlayer->GetName( ) + "|" + potential->GetExternalIPString( ) + "] is trying to join the game over LAN but used an incorrect entry key" );
                potential->Send( m_Protocol->SEND_W3GS_REJECTJOIN( REJECTJOIN_WRONGPASSWORD ) );
                potential->SetDeleteMe( true );
                return;
            }
            }
         */

        const isPlayerReserved = this.isReserved(joinPlayer.name) || this.isOwner(joinPlayer.name);

        // try to find a slot
        let SID = GAME_SLOT_MAX;
        const EnforcePID = GAME_SLOT_MAX;
        const EnforceSID = 0;

        const EnforceSlot = new GameSlot(255, 0, 0, 0, 0, 0, 0);

        if (this.saveGame) {
            /**
             // in a saved game we enforce the player layout and the slot layout
             // unfortunately we don't know how to extract the player layout from the saved game so we use the data from a replay instead
             // the !enforcesg command defines the player layout by parsing a replay

             for( vector<PIDPlayer> :: iterator i = m_EnforcePlayers.begin( ); i != m_EnforcePlayers.end( ); ++i )
             {
                if( (*i).second == joinPlayer->GetName( ) )
                    EnforcePID = (*i).first;
            }

                 for( vector<CGameSlot> :: iterator i = m_EnforceSlots.begin( ); i != m_EnforceSlots.end( ); ++i )
                 {
                if( (*i).GetPID( ) == EnforcePID )
                {
                    EnforceSlot = *i;
                    break;
                }

                EnforceSID++;
            }

                 if( EnforcePID == 255 || EnforceSlot.GetPID( ) == 255 || EnforceSID >= m_Slots.size( ) )
                 {
                CONSOLE_Print( "[GAME: " + m_GameName + "] player [" + joinPlayer->GetName( ) + "|" + potential->GetExternalIPString( ) + "] is trying to join the game but isn't in the enforced list" );
                potential->Send( m_Protocol->SEND_W3GS_REJECTJOIN( REJECTJOIN_FULL ) );
                potential->SetDeleteMe( true );
                return;
            }

                 SID = EnforceSID;
             */
        } else {
            // try to find an empty slot

            SID = this.getEmptySlot( false );

            if (SID == GAME_SLOT_MAX && isPlayerReserved) {
                SID = this.getEmptySlot( true );

                if (SID !== GAME_SLOT_MAX) {
                    const kickedPlayer = this.getPlayerFromSID(SID);

                    if (kickedPlayer) {
                        kickedPlayer
                            .setDeleteMe(true)
                            .setLeftReason(this.ghost.__t('WasKickedForReservedPlayer', joinPlayer.getName()))
                            .setLeftCode(this.protocol.PLAYERLEAVE_LOBBY);

                        // send a playerleave message immediately since it won't normally get sent until the player is deleted which is after we send a playerjoin message
                        // we don't need to call OpenSlot here because we're about to overwrite the slot data anyway
                        this.sendAll(this.protocol.SEND_W3GS_PLAYERLEAVE_OTHERS(kickedPlayer.getPID(), kickedPlayer.getLeftCode()));
                        kickedPlayer.setLeftMessageSent(true);
                    }
                }
            }

            if (SID === GAME_SLOT_MAX && this.isOwner(joinPlayer.getName())) {
                // the owner player is trying to join the game but it's full and we couldn't even find a reserved slot, kick the player in the lowest numbered slot
                // updated this to try to find a player slot so that we don't end up kicking a computer

                SID = 0;

                for( let idx = 0; idx < this.slots.length; ++idx) {
                    if (this.slots[idx].Status === GameSlot.STATUS_OCCUPIED && this.slots[idx].Computer === 0) {
                        SID = idx;
                        break;
                    }
                }

                const kickedPlayer = this.getPlayerFromSID(SID);

                if (kickedPlayer) {
                    kickedPlayer
                        .setDeleteMe(true)
                        .setLeftReason(this.ghost.__t('WasKickedForOwnerPlayer', joinPlayer.getName()))
                        .setLeftCode(this.protocol.PLAYERLEAVE_LOBBY);

                    // send a playerleave message immediately since it won't normally get sent until the player is deleted which is after we send a playerjoin message
                    // we don't need to call OpenSlot here because we're about to overwrite the slot data anyway
                    this.sendAll(this.protocol.SEND_W3GS_PLAYERLEAVE_OTHERS(kickedPlayer.getPID(), kickedPlayer.getLeftCode()));
                    kickedPlayer.setLeftMessageSent(true);
                }
            }
        }

        if (SID >= this.slots.length) {
            potentialPlayer
                .setDeleteMe(true)
                .send(this.protocol.SEND_W3GS_REJECTJOIN(this.protocol.REJECTJOIN_FULL));

            return;
        }

        // check if the new player's name is banned but only if bot_banmethod is 0
        // this is because if bot_banmethod is 0 we need to wait to announce the ban until now because they could have been rejected because the game was full
        // this would have allowed the player to spam the chat by attempting to join the game multiple times in a row

        if (this.ghost.getBanMethod() === 0) {
            // for( vector<CBNET *> :: iterator i = m_GHost->m_BNETs.begin( ); i != m_GHost->m_BNETs.end( ); ++i )
            // {
            //     if( (*i)->GetServer( ) == JoinedRealm )
            //     {
            //         CDBBan *Ban = (*i)->IsBannedName( joinPlayer->GetName( ) );
            //
            //         if( Ban )
            //         {
            //             CONSOLE_Print( "[GAME: " + m_GameName + "] player [" + joinPlayer->GetName( ) + "|" + potential->GetExternalIPString( ) + "] is using a banned name" );
            //             SendAllChat( m_GHost->m_Language->HasBannedName( joinPlayer->GetName( ) ) );
            //             SendAllChat( m_GHost->m_Language->UserWasBannedOnByBecause( Ban->GetServer( ), Ban->GetName( ), Ban->GetDate( ), Ban->GetAdmin( ), Ban->GetReason( ) ) );
            //             break;
            //         }
            //     }
            //
            //     CDBBan *Ban = (*i)->IsBannedIP( potential->GetExternalIPString( ) );
            //
            //     if( Ban )
            //     {
            //         CONSOLE_Print( "[GAME: " + m_GameName + "] player [" + joinPlayer->GetName( ) + "|" + potential->GetExternalIPString( ) + "] is using a banned IP address" );
            //         SendAllChat( m_GHost->m_Language->HasBannedIP( joinPlayer->GetName( ), potential->GetExternalIPString( ), Ban->GetName( ) ) );
            //         SendAllChat( m_GHost->m_Language->UserWasBannedOnByBecause( Ban->GetServer( ), Ban->GetName( ), Ban->GetDate( ), Ban->GetAdmin( ), Ban->GetReason( ) ) );
            //         break;
            //     }
            // }
        }

        // we have a slot for the new player
        // make room for them by deleting the virtual host player if we have to
        if (this.getNumPlayers() >= MAX_SLOTS - 1 || EnforcePID === this.virtualHostPID) {
            this.deleteVirtualHost();
        }



        // turning the CPotentialPlayer into a CGamePlayer is a bit of a pain because we have to be careful not to close the socket
        // this problem is solved by setting the socket to NULL before deletion and handling the NULL case in the destructor
        // we also have to be careful to not modify the m_Potentials vector since we're currently looping through it

        infoPlayer('joined the game');

        const player = GamePlayer.fromPotentialPlayer(
            potentialPlayer,
            this.saveGame ? EnforcePID : this.getNewPID(),
            this.joinedRealm,
            joinPlayer.getName(),
            joinPlayer.getInternalIP(),
            isPlayerReserved
        );

        // consider LAN players to have already spoof checked since they can't
        // since so many people have trouble with this feature we now use the JoinedRealm to determine LAN status

        player.setSpoofed(joinedRealm.length === 0);
        // Player->SetWhoisShouldBeSent( m_GHost->m_SpoofChecks == 1 || ( m_GHost->m_SpoofChecks == 2 && AnyAdminCheck ) );

        this.players.push(player);

        potentialPlayer.setSocket(null).setDeleteMe(true);

        if (this.saveGame) {
            this.slots[SID] = EnforceSlot
        } else {
            if (this.map.getOptions() & Map.OPT_CUSTOMFORCES) {
                this.slots[SID] = new GameSlot(
                    player.PID, 255,
                    GameSlot.STATUS_OCCUPIED, 0,
                    this.slots[SID].Team,
                    this.slots[SID].Color,
                    this.slots[SID].Race
                )
            } else {
                if (this.map.getFlags() & Map.FLAG_RANDOMRACES) {
                    this.slots[SID] = new GameSlot(
                        player.PID,
                        255,
                        GameSlot.STATUS_OCCUPIED,
                        0,
                        MAX_SLOTS,
                        MAX_SLOTS,
                        GameSlot.RACE_RANDOM
                    )
                } else {
                    this.slots[SID] = new GameSlot(
                        player.PID,
                        255,
                        GameSlot.STATUS_OCCUPIED,
                        0,
                        MAX_SLOTS,
                        MAX_SLOTS,
                        GameSlot.RACE_RANDOM | GameSlot.RACE_SELECTABLE
                    )
                }

                // try to pick a team and colour
                // make sure there aren't too many other players already

                let numOtherPlayers = 0;

                // @TODO: rework with reducer
                for (let idx = 0; idx < this.slots.length; ++idx) {
                    if (this.slots[idx].Status == GameSlot.STATUS_OCCUPIED && this.slots[idx].Team !== MAX_SLOTS) {
                        numOtherPlayers++;
                    }
                }

                if (numOtherPlayers < this.map.mapNumPlayers) {
                    this.slots[SID].Team = SID < this.map.mapNumPlayers ? SID : 0;

                    this.slots[SID].Color = this.getNewColor();
                }
            }
        }

        // send slot info to the new player
        // the SLOTINFOJOIN packet also tells the client their assigned PID and that the join was successful

        // Player->Send( m_Protocol->SEND_W3GS_SLOTINFOJOIN( Player->GetPID( ), Player->GetSocket( )->GetPort( ), Player->GetExternalIP( ), m_Slots, m_RandomSeed, m_Map->GetMapLayoutStyle( ), m_Map->GetMapNumPlayers( ) ) );

        player.send(
            this.protocol.SEND_W3GS_SLOTINFOJOIN(
                player.PID,
                player.getExternalPort(),
                player.getExternalIP(),
                this.slots,
                this.randomSeed,
                this.map.getLayoutStyle(),
                this.map.mapNumPlayers
            )
        )

    }

    socketServerSetup(hostPort: number) {
        this.server.on('listening', this.onListening);
        this.server.on('connection', this.onConnection);

        this.server.on('error', this.onError);
        this.server.on('close', this.onClose);

        this.server.listen(hostPort);
    }

    onListening = () => {
        info('BaseGame listening');
    };

    onConnection = (socket: net.Socket) => {
        info('new connection', socket.remoteAddress + ':' + socket.remotePort);

        this.potentials.push(new PotentialPlayer(this.protocol, this, socket));
    };

    onError = (...args) => {
        info('BaseGame', 'error', ...args);
    };

    onClose = (...args) => {
        info('BaseGame', 'close', ...args);
    };

    getNewPID(): number {
        return 0;
    }

    getNewColor(): number {
        return 0
    }

    getEmptySlot(reserved: boolean) {
        if (this.slots.length > GAME_SLOT_MAX) {
            return GAME_SLOT_MAX
        }

        if (this.saveGame) {
            // unfortunately we don't know which slot each player was assigned in the savegame
            // but we do know which slots were occupied and which weren't so let's at least force players to use previously occupied slots

            // vector<CGameSlot> SaveGameSlots = m_SaveGame->GetSlots( );
            //
            // for( unsigned char i = 0; i < m_Slots.size( ); ++i )
            // {
            //     if( m_Slots[i].GetSlotStatus( ) == SLOTSTATUS_OPEN && SaveGameSlots[i].GetSlotStatus( ) == SLOTSTATUS_OCCUPIED && SaveGameSlots[i].GetComputer( ) == 0 )
            //         return i;
            // }

            // don't bother with reserved slots in savegames
        } else {
            // look for an empty slot for a new player to occupy
            // if reserved is true then we're willing to use closed or occupied slots as long as it wouldn't displace a player with a reserved slot

            const openSlotIdx = this.slots.findIndex( slot => slot.Status === GameSlot.STATUS_OPEN);

            if (openSlotIdx >= 0) {
                return openSlotIdx;
            }

            if (reserved)
            {
                // no empty slots, but since player is reserved give them a closed slot
                const closedSlotIdx = this.slots.findIndex(slot => slot.Status == GameSlot.STATUS_CLOSED);

                if (closedSlotIdx >= 0) {
                    return closedSlotIdx
                }

                // no closed slots either, give them an occupied slot but not one occupied by another reserved player
                // first look for a player who is downloading the map and has the least amount downloaded so far

                let leastDownloaded = 100;
                let leastSID = GAME_SLOT_MAX;

                this.slots.forEach((slot, idx) => {
                    const player = this.getPlayerFromSID(idx);

                    if (player && !player.isReserved && slot.DownloadStatus < leastDownloaded) {
                        leastDownloaded = slot.DownloadStatus;
                        leastSID = idx;
                    }
                });

                if (leastSID != GAME_SLOT_MAX) {
                    return leastSID;
                }

                // nobody who isn't reserved is downloading the map, just choose the first player who isn't reserved

                const notReservedPlayerIdx = this.slots.findIndex((slot, idx) => {
                    const player = this.getPlayerFromSID(idx);

                    return player && !player.isReserved;
                });

                if (notReservedPlayerIdx >= 0) {
                    return notReservedPlayerIdx
                }
            }
        }

        return GAME_SLOT_MAX
    }

    getPlayerFromPID(PID: number) {
        return this.players.find(player => player.getIsLeftMessageSent() && player.getPID() == PID)
    }

    getPlayerFromSID(SID: number): GamePlayer | null {
        if (SID < this.slots.length)
            return this.getPlayerFromPID(this.slots[SID].PID);

        return null;
    }

    getNumPlayers(): number {
        return 0;
    }

    /**
     * @param {String} name
     * @param {Boolean} sensitive
     */
    getPlayerFromName(name, sensitive) {
        var player;
        var testName;

        for (var i = 0; i <= this.players.length; ++i) {
            player = this.players;

            if (player.isLeftMessageSent) {
                testName = player.name;

                if (testName === name) {
                    return this.players[i];
                }
            }
        }
    }

    sendAll(buffer: Buffer) {
        this.players.forEach(player => player.send(buffer))
    }

    isReserved(name: string) {
        return false;
    }

    isOwner(name: string) {
        return false;
    }

    deleteVirtualHost() {

    }

    update() {

        /*
        	for( vector<CPotentialPlayer *> :: iterator i = m_Potentials.begin( ); i != m_Potentials.end( ); )
            {
                if( (*i)->Update( fd ) )
                {
                    // flush the socket (e.g. in case a rejection message is queued)

                    if( (*i)->GetSocket( ) )
                        (*i)->GetSocket( )->DoSend( (fd_set *)send_fd );

                    delete *i;
                    i = m_Potentials.erase( i );
                }
                else
                    ++i;
            }
            // this.potentials
         */

        const interval = getTicks() - this.lastPingTime;
        const {udpSocket} = this.ghost;
        const fixedHostCounter = this.hostCounter & 0x0FFFFFFF;

        if (interval > GAME_REHOST_INTERVAL) { // refresh every 5 sec
            if (!this.countDownStarted) {
                const buffer = this.protocol.SEND_W3GS_GAMEINFO(
                    !!this.ghost.TFT,
                    this.ghost.lanWar3Version,
                    ByteUInt32(Map.TYPE_UNKNOWN0),
                    this.map.getGameFlags(),
                    this.map.mapWidth,
                    this.map.mapHeight,
                    this.gameName,
                    this.creatorName,
                    getTicks() - this.creationTime,
                    this.map.mapPath,
                    this.map.mapCRC,
                    12,
                    12,
                    this.hostPort,
                    fixedHostCounter
                );

                // @TODO: erro handling
                udpSocket.send(buffer, 6112, '255.255.255.255');
            }

            this.lastPingTime = getTicks();
        }

        return this.exiting;
    }

    exit() {
        this.server.close();
    }
}
