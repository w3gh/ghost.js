import * as net from 'net';
import {ByteUInt32} from '../Bytes';
import {EventEmitter} from 'events';
import {GameProtocol} from './GameProtocol';
import {Map} from './Map';
import {GamePlayer} from './GamePlayer';
import {createLoggerFor, hex} from '../Logger';
import {PotentialPlayer} from "./PotentialPlayer";
import {GameSlot} from "./GameSlot";
import {GHost} from "../GHost";
import {getTicks} from "../util";
import { IncomingJoinPlayer } from './IncomingJoinPlayer';

const {debug, info, error} = createLoggerFor('BaseGame');

const GAME_REHOST_INTERVAL = 5000;

export class BaseGame extends EventEmitter {
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
    private virtualHostPID: number = 255;
    protected virtualHostName: string = 'Map';

    private fakePlayerPID: number = 255;

    constructor(public ghost: GHost,
                private hostCounter: number,
                public map: Map,
                public saveGame = null,
                public hostPort: number,
                public gameState: number,
                public gameName: string,
                public ownerName: string,
                public creatorName = 'JiLiZART',
                public creatorServer: string = '') {
        super();

        this.slots = this.map.slots;

        this.lastGameName = gameName;

        this.socketServerSetup(hostPort);

        this.on('player.joined', this.onPlayerJoined.bind(this));
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

        const isReserved = this.isReserved(joinPlayer.name) || this.isOwner(joinPlayer.name);

        // try to find a slot
        let SID = 255;
        const EnforcePID = 255;
        const EnforceSID = 0;

        const EnforceSlot = [255, 0, 0, 0, 0, 0, 0];

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

        }

        if (SID >= this.slots.length) {
            potentialPlayer.send(this.protocol.SEND_W3GS_REJECTJOIN(this.protocol.REJECTJOIN_FULL));
            potentialPlayer.setDeleteMe(true);
            return null;
        }

        if (this.getNumPlayers() >= 11 || EnforcePID === this.virtualHostPID) {
            this.deleteVirtualHost();
        }

        infoPlayer('joined the game');

        // this.players.push(new GamePlayer(
        //     potentialPlayer,
        //     this.getNewPID(),
        //     null,
        //     joinPlayer.name,
        //     joinPlayer.getInternalIP(),
        //     Reserved
        // ));

        potentialPlayer.setDeleteMe(true);

        /*
         if( m_Map->GetMapOptions( ) & MAPOPT_CUSTOMFORCES )
         m_Slots[SID] = CGameSlot( Player->GetPID( ), 255, SLOTSTATUS_OCCUPIED, 0, m_Slots[SID].GetTeam( ), m_Slots[SID].GetColour( ), m_Slots[SID].GetRace( ) );
         else
         {
         if( m_Map->GetMapFlags( ) & MAPFLAG_RANDOMRACES )
         m_Slots[SID] = CGameSlot( Player->GetPID( ), 255, SLOTSTATUS_OCCUPIED, 0, 12, 12, SLOTRACE_RANDOM );
         else
         m_Slots[SID] = CGameSlot( Player->GetPID( ), 255, SLOTSTATUS_OCCUPIED, 0, 12, 12, SLOTRACE_RANDOM | SLOTRACE_SELECTABLE );

         // try to pick a team and colour
         // make sure there aren't too many other players already

         unsigned char NumOtherPlayers = 0;

         for( unsigned char i = 0; i < m_Slots.size( ); ++i )
         {
         if( m_Slots[i].GetSlotStatus( ) == SLOTSTATUS_OCCUPIED && m_Slots[i].GetTeam( ) != 12 )
         NumOtherPlayers++;
         }

         if( NumOtherPlayers < m_Map->GetMapNumPlayers( ) )
         {
         if( SID < m_Map->GetMapNumPlayers( ) )
         m_Slots[SID].SetTeam( SID );
         else
         m_Slots[SID].SetTeam( 0 );

         m_Slots[SID].SetColour( GetNewColour( ) );
         }
         }
         */
    }

    socketServerSetup(hostPort) {
        this.server.on('listening', this.onListening);
        this.server.on('connection', this.onConnection);

        this.server.on('error', this.onError);
        this.server.on('close', this.onClose);

        this.server.listen(hostPort);
    }

    onListening = () => {
        info('BaseGame listening');
    };

    onConnection = (socket) => {
        info('BaseGame Potential Player connected', socket.remoteAddress + ':' + socket.remotePort);

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

    getEmptySlot(reserved: boolean) {
        if (this.slots.length > 255) {
            return 255
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

            // for( unsigned char i = 0; i < m_Slots.size( ); ++i )
            // {
            //     if( m_Slots[i].GetSlotStatus( ) == SLOTSTATUS_OPEN )
            //         return i;
            // }

            if( reserved )
            {
                // no empty slots, but since player is reserved give them a closed slot
                const slotIdx = this.slots.findIndex(slot => slot.Status == GameSlot.STATUS_OPEN);

                if (slotIdx >= 0) {
                    return slotIdx
                }

                // no closed slots either, give them an occupied slot but not one occupied by another reserved player
                // first look for a player who is downloading the map and has the least amount downloaded so far

                let leastDownloaded = 100;
                let leastSID = 255;

                this.slots.forEach((slot, idx) => {
                    const player = this.getPlayerFromSID(idx);

                    if (player && !player.getReserved() && slot.DownloadStatus < leastDownloaded) {

                    }
                });

                // for( unsigned char i = 0; i < m_Slots.size( ); ++i )
                // {
                //     CGamePlayer *Player = GetPlayerFromSID( i );
                //
                //     if( Player && !Player->GetReserved( ) && m_Slots[i].GetDownloadStatus( ) < LeastDownloaded )
                //     {
                //         LeastDownloaded = m_Slots[i].GetDownloadStatus( );
                //         LeastSID = i;
                //     }
                // }

                if ( leastSID != 255 )
                    return leastSID;

                // nobody who isn't reserved is downloading the map, just choose the first player who isn't reserved

                // for( unsigned char i = 0; i < m_Slots.size( ); ++i )
                // {
                //     CGamePlayer *Player = GetPlayerFromSID( i );
                //
                //     if( Player && !Player->GetReserved( ) )
                //     return i;
                // }
            }
        }

        /*

	else
	{

	}

	return 255;
         */

        return 255
    }

    getPlayerFromPID(PID: number) {
        // for( vector<CGamePlayer *> :: iterator i = m_Players.begin( ); i != m_Players.end( ); ++i )
        // {
        //     if( !(*i)->GetLeftMessageSent( ) && (*i)->GetPID( ) == PID )
        //     return *i;
        // }

        // @TODO:
        const foundPlayer = this.players.find(player => player.getIsLeftMessageSent() && player.getPID() == PID)

        return null
    }

    getPlayerFromSID(SID: number) {
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

                // const errCallback = (err, bytes) => {
                //     info('send error', 6112, 'BaseGame bytes sent', bytes);
                //
                //     if (err) throw err;
                // };

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
