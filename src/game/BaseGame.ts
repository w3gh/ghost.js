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

        var Reserved = this.isReserved(joinPlayer.name) || this.isOwner(joinPlayer.name);

        // try to find a slot
        var SID = 255;
        var EnforcePID = 255;
        var EnforceSID = 0;

        var gameSlot = [255, 0, 0, 0, 0, 0, 0];

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

    getEmptySlot() {

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
