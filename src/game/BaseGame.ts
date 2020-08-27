import * as net from 'net';
import {ByteUInt32, ByteArray} from '../Bytes';
import {EventEmitter} from 'events';
import {GameProtocol} from './GameProtocol';
import {Map} from './Map';
import {GamePlayer} from './GamePlayer';
import {createLoggerFor, hex} from '../Logger';
import {PotentialPlayer} from "./PotentialPlayer";
import {GameSlot, MAX_SLOTS, GAME_SLOT_MAX} from "./GameSlot";
import {GHost} from "../GHost";
import {getTicks, getTime} from "../util";
import {IncomingJoinPlayer} from './IncomingJoinPlayer';

const {debug, info, error} = createLoggerFor('BaseGame');

const GAME_REHOST_INTERVAL = 5; // 5 sec

export const GAME_NAME_MAX = 31;

export class BaseGame extends EventEmitter {
    static EVENT_PLAYER_JOINED = 'player.joined';
    static EVENT_PLAYER_DELETED = 'player.deleted';

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
    private lastConnectionId = 0;
    private connections: net.Socket[] = [];
    protected virtualHostName: string = 'Map';
    protected joinedRealm: string = '';
    public gameName: string = '';
    protected gameLoading = false;
    protected gameLoaded = false;
    protected slotInfoChanged = false;

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

        this.lastGameName = gameName.substr(0, GAME_NAME_MAX);
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
        const rejectPotentialPlayer = () => potentialPlayer.setDeleteMe(true).send(this.protocol.SEND_W3GS_REJECTJOIN(this.protocol.REJECTJOIN_FULL));

        // check if the new player's name is empty or too long
        if (!joinPlayer.isNameValid()) {
            infoPlayer(`is trying to join the game with an invalid name of length ${joinPlayer.getName().length}`);
            rejectPotentialPlayer();
            return null
        }

        // check if the new player's name is the same as the virtual host name
        if (joinPlayer.name === this.virtualHostName) {
            infoPlayer(`is trying to join the game with the virtual host name`);
            rejectPotentialPlayer();
            return null;
        }

        // check if the new player's name is already taken
        if (this.getPlayerFromName(joinPlayer.name, false)) {
            infoPlayer(`is trying to join the game but that name is already taken`);
            rejectPotentialPlayer();
            return null;
        }

        const isPlayerReserved = this.isReserved(joinPlayer.name) || this.isOwner(joinPlayer.name);

        // try to find a slot
        let SID = GAME_SLOT_MAX;
        const EnforcePID = GAME_SLOT_MAX;
        const EnforceSID = 0;

        const EnforceSlot = new GameSlot(255, 0, 0, 0, 0, 0, 0);

        if (this.saveGame) {
        } else {
            // try to find an empty slot

            SID = this.getEmptySlot(false);

            if (SID == GAME_SLOT_MAX && isPlayerReserved) {
                SID = this.getEmptySlot(true);

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

                for (let idx = 0; idx < this.slots.length; ++idx) {
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
            error('SID >= this.slots.length');
            rejectPotentialPlayer();

            return;
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

        player.setSpoofed(true);
        // Player->SetWhoisShouldBeSent( m_GHost->m_SpoofChecks == 1 || ( m_GHost->m_SpoofChecks == 2 && AnyAdminCheck ) );

        this.players.push(player);
        this.connections[potentialPlayer.socketId]['@owner'] = player;

        potentialPlayer.setDeleteMe(true);

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
        );

        // send virtual host info and fake player info (if present) to the new player

        this.sendVirtualHostPlayerInfo(player);
        this.sendFakePlayerInfo(player);

        const blankIP = '0.0.0.0';
        const hideIP = this.isHideIPAddresses();

        for (let plr of this.players) {
            if (!plr.getIsLeftMessageSent() && plr !== player) {

                // send info about the new player to every other player
                plr.send(this.protocol.SEND_W3GS_PLAYERINFO(
                    player.getPID(),
                    player.getName(),
                    hideIP ? blankIP : player.getExternalIP(),
                    hideIP ? blankIP : player.getInternalIP(),
                ));

                // send info about every other player to the new player
                player.send(this.protocol.SEND_W3GS_PLAYERINFO(
                    plr.getPID(),
                    plr.getName(),
                    hideIP ? blankIP : plr.getExternalIP(),
                    hideIP ? blankIP : plr.getInternalIP(),
                ))
            }
        }

        // send a map check packet to the new player

        player.send(this.protocol.SEND_W3GS_MAPCHECK(this.map.getPath(), this.map.getSize(), this.map.getInfo(), this.map.getCRC(), this.map.getSHA1()))


        // send slot info to everyone, so the new player gets this info twice but everyone else still needs to know the new slot layout

        this.sendAllSlotInfo();

        // send a welcome message

        // this.sendWelcomeMessage(player);
    }

    socketServerSetup(hostPort: number) {
        this.server.on('listening', this.onListening);
        this.server.on('connection', this.onConnection);

        this.server.on('error', this.onError);
        this.server.on('close', this.onClose);

        this.server.listen(hostPort);
    }

    onListening = () => {
        info('listening');
    };

    onConnection = (socket: net.Socket) => {
        info('new connection', socket.remoteAddress + ':' + socket.remotePort);
        const socketId = this.lastConnectionId + 1;
        const player = new PotentialPlayer(this.protocol, this, socketId);

        socket['@owner'] = player;

        this.connections[socketId] = socket;

        socket
            .on('lookup', function (...args) {
                socket['@owner'].onLookup(...args);
            })
            .on('connect', function (...args) {
                socket['@owner'].onConnect(...args);
            })
            .on('data', function (...args) {
                socket['@owner'].onData(...args);
            })
            .on('end', function (...args) {
                socket['@owner'].onEnd(...args);
            })
            .on('timeout', function (...args) {
                socket['@owner'].onTimeout(...args);
            })
            .on('drain', function (...args) {
                socket['@owner'].onDrain(...args);
            })
            .on('error', function (...args) {
                socket['@owner'].onError(...args);
            })
            .on('close', (...args) => {
                socket['@owner'].onClose(...args);
                socket['@owner'].setDeleteMe(true);
                socket.destroy();
                this.connections[socketId] = null;
            });

        this.potentials.push(player);
    };

    onError = (...args) => {
        info('BaseGame', 'error', ...args);
    };

    onClose = (...args) => {
        info('BaseGame', 'close', ...args);
    };

    getSocket(id: number): net.Socket {
        return this.connections[id]
    }

    getNewPID(): number {
        // find an unused PID for a new player to use

        for (let testPID = 1; testPID < GAME_SLOT_MAX; ++testPID) {
            if (testPID === this.virtualHostPID || testPID === this.fakePlayerPID) {
                continue;
            }

            let inUse = false;

            for (let plr of this.players) {
                if (!plr.getIsLeftMessageSent() && plr.getPID() === testPID) {
                    inUse = true;
                    break;
                }
            }

            if (!inUse) {
                return testPID;
            }
        }

        // this should never happen
        return GAME_SLOT_MAX;
    }

    getNewColor(): number {
        // find an unused colour for a player to use

        for (let testColor = 0; testColor < MAX_SLOTS; ++testColor) {
            let inUse = false;

            for (let idx = 0; idx < this.slots.length; ++idx) {
                if (this.slots[idx].Color === testColor) {
                    inUse = true;
                    break;
                }
            }

            if (!inUse) {
                return testColor;
            }
        }

        // this should never happen

        return MAX_SLOTS;
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

            const openSlotIdx = this.slots.findIndex(slot => slot.Status === GameSlot.STATUS_OPEN);

            if (openSlotIdx >= 0) {
                return openSlotIdx;
            }

            if (reserved) {
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

    getNumHumanPlayers() {
        return this.players.filter(player => !player.getIsLeftMessageSent()).length;
    }

    getNumPlayers(): number {
        let numPlayers = this.getNumHumanPlayers();

        if (this.fakePlayerPID != GAME_SLOT_MAX)
            ++numPlayers;

        return numPlayers;
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

    getHostPID() {
        // return the player to be considered the host (it can be any player) - mainly used for sending text messages from the bot
        // try to find the virtual host player first

        if (this.virtualHostPID != GAME_SLOT_MAX)
            return this.virtualHostPID;

        // try to find the fakeplayer next

        if (this.fakePlayerPID != GAME_SLOT_MAX)
            return this.fakePlayerPID;

        // try to find the owner player next

        // @TODO:

        // okay then, just use the first available player

        for (let plr of this.players) {
            if (!plr.getIsLeftMessageSent()) {
                return plr.getPID();
            }
        }


        return GAME_SLOT_MAX;
    }

    // hide player ip from others
    isHideIPAddresses() {
        return true
    }

    sendVirtualHostPlayerInfo(player: GamePlayer) {
        if (this.virtualHostPID == GAME_SLOT_MAX)
            return;

        const IP = '0.0.0.0';

        player.send(this.protocol.SEND_W3GS_PLAYERINFO(this.virtualHostPID, this.virtualHostName, IP, IP));
    }

    sendFakePlayerInfo(player: GamePlayer) {
        if (this.fakePlayerPID == GAME_SLOT_MAX)
            return;

        const IP = '0.0.0.0';

        player.send(this.protocol.SEND_W3GS_PLAYERINFO(this.fakePlayerPID, "fake::player", IP, IP));
    }

    sendAll(buffer: Buffer) {
        this.players.forEach(player => player.send(buffer))
    }

    sendChat(player: GamePlayer, message: string) {
        // @TODO: make as argument
        const fromPID = this.getHostPID();
        if (message.length > 254) {
            message = message.substr(0, 254);
        }

        if (player) {
            if (!this.gameLoading && !this.gameLoaded) {
                player.send(this.protocol.SEND_W3GS_CHAT_FROM_HOST(fromPID, ByteArray([player.getPID()]), 16, ByteArray([]), message));
            } else {

            }
        }
    }

    sendAllSlotInfo() {
        if (!this.gameLoading && !this.gameLoaded) {
            this.sendAll(this.protocol.SEND_W3GS_SLOTINFO(this.slots, this.randomSeed, this.map.getLayoutStyle(), this.map.mapNumPlayers));
            this.slotInfoChanged = false;
        }
    }

    sendWelcomeMessage(player: GamePlayer) {
        this.sendChat(player, ' ');
        this.sendChat(player, ' ');
        this.sendChat(player, ' ');
        this.sendChat(player, 'Ghost.js https://github.com/w3gh/ghost.js/');
        this.sendChat(player, '-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-');
        this.sendChat(player, `     Game Name:                 ${this.gameName}`);
    }

    isReserved(name: string) {
        return false;
    }

    isOwner(name: string) {
        return false;
    }

    createVirtualHost() {
        if (this.virtualHostPID != GAME_SLOT_MAX)
            return;

        this.virtualHostPID = this.getNewPID();
        const IP = '0.0.0.0';

        this.sendAll(this.protocol.SEND_W3GS_PLAYERINFO(this.virtualHostPID, this.virtualHostName, IP, IP));
    }

    deleteVirtualHost() {
        if (this.virtualHostPID == GAME_SLOT_MAX)
            return;

        this.sendAll(this.protocol.SEND_W3GS_PLAYERLEAVE_OTHERS(this.virtualHostPID, this.protocol.PLAYERLEAVE_LOBBY));
        this.virtualHostPID = GAME_SLOT_MAX;
    }

    update() {

        // update players

        this.players.forEach((player, idx) => {
            if (player.update()) {
                info(`deleting GamePlayer ${idx}`);
                this.emit(BaseGame.EVENT_PLAYER_DELETED, player);

                this.players[idx] = null;
                delete this.players[idx];
            }
        });

        this.potentials.forEach((player, idx) => {
            if (player.update()) {
                info(`deleting PotentialPlayer ${idx}`);
                this.potentials[idx] = null;
                delete this.potentials[idx];
            }
        });

        const interval = getTime() - this.lastPingTime;
        const {udpSocket} = this.ghost;
        const fixedHostCounter = this.hostCounter & 0x0FFFFFFF;

        // create the virtual host player

        if (!this.gameLoading && !this.gameLoaded && this.getNumPlayers() < MAX_SLOTS)
            this.createVirtualHost();

        if (interval > GAME_REHOST_INTERVAL) { // refresh every 5 sec
            // note: we must send pings to players who are downloading the map because Warcraft III disconnects from the lobby if it doesn't receive a ping every ~90 seconds
            // so if the player takes longer than 90 seconds to download the map they would be disconnected unless we keep sending pings
            // todotodo: ignore pings received from players who have recently finished downloading the map

            this.sendAll(this.protocol.SEND_W3GS_PING_FROM_HOST());

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

            this.lastPingTime = getTime();
        }

        return this.exiting;
    }

    exit() {
        this.server.close();
    }
}
