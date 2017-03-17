import * as net from 'net';
import {ByteUInt32} from './../Bytes';
import {EventEmitter} from 'events';
import {GameProtocol} from './GameProtocol';
import {Map} from './Map';
import {GamePlayer} from './GamePlayer';
import {create, hex} from '../Logger';
import {PotentialPlayer} from "./PotentialPlayer";
import {GameSlot} from "./GameSlot";
import {GHost} from "../GHost";
import {getTicks} from "../util";

const {debug, info, error} = create('BaseGame');

const GAME_REHOST_INTERVAL = 5000;

export class BaseGame extends EventEmitter {
    private protocol: GameProtocol = new GameProtocol(this);
    private server: net.Server = net.createServer();
    private map: Map;
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
    private hostCounter: number;
    private virtualHostPID: number = 255;
    protected virtualHostName: string = 'Map';

    private fakePlayerPID: number = 255;

    constructor(public ghost: GHost,
                map,
                public saveGame = null,
                public hostPort: number,
                public gameState: number,
                public gameName: string,
                public ownerName: string,
                public creatorName = 'JiLiZART',
                public creatorServer: string = '') {
        super();

        this.map = (map instanceof Map) ? map : new Map(map);

        this.slots = this.map.getSlots();

        this.hostCounter = ghost.hostCounter++;
        this.lastGameName = gameName;

        this.socketServerSetup(hostPort);

        this.on('player.joined', this.onPlayerJoined.bind(this));
    }

    /**
     * @param {PotentialPlayer} potentialPlayer
     * @param {IncomingJoinPlayer} joinPlayer
     */
    onPlayerJoined(potentialPlayer, joinPlayer) {
        info('BaseGame player joined', arguments);

        // check if the new player's name is empty or too long
        if (!joinPlayer.name.length || joinPlayer.name.length > 15) {
            potentialPlayer.send(this.protocol.SEND_W3GS_REJECTJOIN(this.protocol.REJECTJOIN_FULL));
        }

        // check if the new player's name is the same as the virtual host name
        if (joinPlayer.name === this.virtualHostName) {
            potentialPlayer.send(this.protocol.SEND_W3GS_REJECTJOIN(this.protocol.REJECTJOIN_FULL));
            potentialPlayer.setDeleteMe(true);
            return null;
        }

        // check if the new player's name is already taken
        if (this.getPlayerFromName(joinPlayer.name, false)) {
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

        info('Game', this.gameName, ' player', joinPlayer.name, '|', potentialPlayer.getExternalIP(), 'joined the game');

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
        const interval = getTicks() - this.lastPingTime;
        const socket = this.ghost.udpSocket;
        const fixedHostCounter = this.hostCounter & 0x0FFFFFFF;

        if (interval > GAME_REHOST_INTERVAL) { // refresh every 5 sec

            if (!this.countDownStarted) {
                const buffer = this.protocol.SEND_W3GS_GAMEINFO(
                    this.ghost.TFT,
                    this.ghost.lanWar3Version,
                    ByteUInt32(Map.TYPE_UNKNOWN0),
                    this.map.getGameFlags(),
                    this.map.getWidth(),
                    this.map.getHeight(),
                    this.gameName,
                    this.creatorName,
                    getTicks() - this.creationTime,
                    this.map.getPath(),
                    this.map.getCRC(),
                    12,
                    12,
                    this.hostPort,
                    fixedHostCounter
                );

                const errCallback = (err, bytes) => {
                    if (err) throw err;

                    info('localhost', 6112, 'BaseGame bytes sent', bytes);
                };

                // this.ghost.networkInterfaces().forEach((iface) => {
                // 	//this.udpSocket.addMembership(iface.address);
                // 	socket.send(buffer, 0, buffer.length, 6112, iface.address, errCallback);
                // });

                socket.send(buffer, 6112, 'localhost', errCallback);
            }

            this.lastPingTime = getTicks();
        }
    }

    close() {
        this.server.close();
    }
}
