import * as net from 'net';
import * as assert from 'assert';
import * as path from 'path';
import * as EventEmitter from 'events';
import {getTicks, getTime} from '../util';
import {BytesExtract, GetLength, ByteExtractUInt32} from '../Bytes';
import {BNET_HEADER_CONSTANT, BNetProtocol} from './BNetProtocol';
import {Plugin} from '../Plugin';
import {CommandPacket} from '../CommandPacket';
// import {BNCSUtil} from '../BNCSUtil';
import {createLoggerFor, hex} from '../Logger';
import {Config} from "../Config";
// import {IncomingFriend} from "./IncomingFriend";
import {IncomingChatEvent} from "./IncomingChatEvent";
// import {AuthInfo} from "./AuthInfo";
// import {AuthState} from "./AuthState";
// import {AccountLogon} from "./AccountLogon";
// import {AccountLogonProof} from "./AccountLogonProof";
import {IBNetSIDHandler} from "./IBNetSIDHandler";
import {IBNetSIDReceiver} from "./IBNetSIDReceiver";
import {IBNetConnection} from "./IBNetConnection";
import {IBNet} from "./IBNet";
import { BNetEvent } from './BNetEvent';

const {debug, info, error} = createLoggerFor('BNet');

/**
 * Class for connecting to battle.net
 * @param {Object} options
 * @constructor
 */
export class BNetConnection extends EventEmitter implements IBNetConnection, IBNet {
    private enabled: boolean;
    private socket: net.Socket = new net.Socket();
    private protocol: BNetProtocol = new BNetProtocol(this);

    // private bncs: BNCSUtil = new BNCSUtil();
    // private data: Buffer = Buffer.from('');
    private incomingPackets: CommandPacket[] = [];
    private incomingBuffer: Buffer = Buffer.from('');
    public readonly clientToken: Buffer = Buffer.from('\xdc\x01\xcb\x07', 'binary');

    private readonly admins: string[] = [];
    private outPackets = [];
    private connected: boolean = false;
    private connecting: boolean = false;
    private exiting: boolean = false;
    private lastDisconnectedTime: number = 0;
    private lastConnectionAttemptTime: number = 0;
    private lastNullTime: number = 0;
    private lastOutPacketTicks: number = 0;
    private lastOutPacketSize: number = 0;
    private frequencyDelayTimes: number = 0;
    private firstConnect: boolean = true;
    private waitingToConnect: boolean = true;
    private _loggedIn: boolean = false;
    private _inChat: boolean = false;
    private _inGame: boolean = false;
    private commandTrigger: string;
    private server: string;
    public alias: string;
    private bnlsServer: string;
    private bnlsPort: number;
    private bnlsWardenCookie: string;
    private war3version: string;

    public readonly exeVersion: string;
    public readonly exeVersionHash: string;

    private _passwordHashType: string;
    private pvpgnRealmName: string;
    private maxMessageLength: number;
    private localeID: number;
    private countryAbbrev: string;
    private country: string;
    private language: string;
    private timezone: number;
    public readonly war3Path: string;
    public readonly war3exePath: string;
    public readonly stormdllPath: string;
    public readonly gamedllPath: string;
    public readonly keyROC: string;
    public readonly keyTFT: string;
    public readonly username: string;
    public readonly password: string;
    private _firstChannel: string;
    private rootAdmin: string;
    private plugins;
    private waitTicks: number;
    nls: Buffer;

    constructor(private id: number,
                public readonly TFT: number,
                public readonly hostPort: number,
                config: Config,
                private packetHandler: IBNetSIDHandler,
                private packetReceiver: IBNetSIDReceiver) {
        super();

        if (!config) {
            info(`empty config for battle.net connection #${this.id}`);
            return;
        }

        this.configure(config);

        this.exeVersion = config.item('custom.exeversion', '');
        this.exeVersionHash = config.item('custom.exeversionhash', '');

        this.war3Path = path.resolve(config.item('war3path', './war3'));
        this.war3exePath = path.resolve(config.item('war3exe', 'war3.exe'));
        this.stormdllPath = path.resolve(config.item('stormdll', 'Storm.dll'));
        this.gamedllPath = path.resolve(config.item('gamedll', 'game.dll'));

        this.keyROC = config.item('keyroc', 'FFFFFFFFFFFFFFFFFFFFFFFFFF');
        assert(this.keyROC !== '', 'ROC CD-Key empty');
        this.keyTFT = config.item('keytft', 'FFFFFFFFFFFFFFFFFFFFFFFFFF');
        assert(this.keyTFT !== '', 'TFT CD-Key empty');

        this.username = config.item('username', '');
        assert(this.username !== '', 'username empty');
        this.password = config.item('password', '');
        assert(this.password !== '', 'password empty');

        if (!this.enabled) {
            return;
        }

        info(`found battle.net connection [#${this.id}] for server [${this.server}]`);

        this.on('SID_CHATEVENT', (that, event: IncomingChatEvent) => {
            if (event.message === '?trigger') {
                this.queueChatCommand(`Command trigger is ${this.commandTrigger}`);
            }
        });

        this.on('command', (that, argv) => {
            debug('got command', argv);
        });
    }

    configure(config: Config) {
        this.enabled = config.item('enabled', true);
        this.server = config.item('server', null);
        this.alias = config.item('alias', null);

        this.bnlsServer = config.item('bnls.server', '');
        this.bnlsPort = config.item('bnls.port', 9367);
        this.bnlsWardenCookie = config.item('bnls.wardencookie', null);

        this.commandTrigger = config.item('commandtrigger', '!');
        assert(this.commandTrigger !== '', 'command trigger empty');

        this.war3version = config.item('custom.war3version', '26');

        this._passwordHashType = config.item('custom.passwordhashyype', '');
        this.pvpgnRealmName = config.item('custom.pvpgnrealmname', 'PvPGN Realm');
        this.maxMessageLength = Number(config.item('custom.maxmessagelength', '200'));

        this.localeID = config.item('localeid', 1049); //Russian
        this.countryAbbrev = config.item('countryabbrev', 'RUS');
        this.country = config.item('country', 'Russia');
        this.language = config.item('language', 'ruRU');
        this.timezone = config.item('timezone', 300);

        this._firstChannel = config.item('firstchannel', 'The Void');
        this.rootAdmin = config.item('rootadmin', null);
        this.plugins = config.item('plugins', {});
    }

    configureSocket() {
        this.socket
            .on('close', () => {
                info(`[${this.alias}] connection close`);
                this.connected = false;
                this.connecting = false;
            })

            .on('connect', () => {
                this.connected = true;
                this.connecting = true;
            })

            .on('data', this.processBuffer.bind(this))

            .on('drain', (...args) => {
                debug(`[${this.alias}] connection drain`, ...args);
            })

            .on('end', (...args) => {
                debug(`[${this.alias}] connection end`, ...args);
            })

            .on('error', (err) => {
                error(`[${this.alias}] disconnected from battle.net due to socket error ${err}`);

                this.lastDisconnectedTime = getTime();
                this._loggedIn = false;
                this._inChat = false;
                this.waitingToConnect = true;
                this.connected = false;
                this.connecting = false;
            })

            .on('lookup', () => {
                debug(`[${this.alias}] connection lookup`);
            })

            .on('timeout', () => {
                debug(`[${this.alias}] connection timeout`);
            });
    }

    configurePlugins() {
        Plugin.emit(Plugin.EVENT_ON_BNET_INIT, this);
    }

    /**
     * @param {Buffer|Array} buffer
     * @returns {*|Number}
     */
    sendPackets(buffer) {
        buffer = Array.isArray(buffer) ? Buffer.concat(buffer) : buffer;
        assert(Buffer.isBuffer(buffer), 'BNet.sendPackets expects buffer');

        hex(buffer);
        return this.socket.write(buffer);
    }

    processBuffer(buffer) {
        debug(`[${this.alias}] connection receive buffer`,);
        hex(buffer);
        debug(`of length ${buffer.length}`);

        if (this.protocol.haveHeader(buffer)) {
            const bytesLength = GetLength(buffer);

            debug(`expected length ${bytesLength}`);
        }

        this.incomingBuffer = Buffer.concat([this.incomingBuffer, buffer]);

        this.extractPackets();
        this.processPackets();
    }

    extractPackets() {
        let lengthProcessed = 0;

        // a packet is at least 4 bytes so loop as long as the buffer contains 4 bytes
        while (this.incomingBuffer.length >= 4) {
            const buffer = this.incomingBuffer;

            if (!this.protocol.haveHeader(buffer)) {
                error('received invalid packet from battle.net (bad header constant), disconnecting');
                this.disconnect();
                return;
            }

            const bytesLength = GetLength(buffer);

            if (buffer.length >= bytesLength) {
                this.incomingPackets.push(
                    new CommandPacket(
                        BNET_HEADER_CONSTANT,
                        buffer[1],
                        buffer.slice(0, bytesLength)
                    )
                );

                this.incomingBuffer = buffer.slice(bytesLength);

                lengthProcessed += bytesLength
            } else { // still waiting for rest of the packet
                return;
            }
        }
    }

    processPackets() {
        while (this.incomingPackets.length) {
            const packet = this.incomingPackets.pop();

            if (packet.type === BNET_HEADER_CONSTANT) {
                const receiver = this.packetReceiver[packet.id], // this.protocol.receivers[packet.id],
                    handler = this.packetHandler[packet.id]; // this.handlers[packet.id];

                if (!handler || !receiver) {
                    (!handler) && error(`handler for packet '${packet.id}' not found`);
                    (!receiver) && error(`receiver for packet '${packet.id}' not found`);

                    continue;
                }

                handler && receiver && handler(this, this.protocol, receiver(packet.buffer));
            }
        }
    }

    update() {
        if (this.connecting) {
            info(`[${this.alias}] connected`);

            this.sendPackets(this.protocol.SEND_PROTOCOL_INITIALIZE_SELECTOR());
            this.sendPackets(
                this.protocol.SEND_SID_AUTH_INFO(
                    this.war3version,
                    this.TFT,
                    this.localeID,
                    this.countryAbbrev,
                    this.country,
                    this.language
                )
            );

            this.lastNullTime = getTime();
            this.lastOutPacketTicks = getTicks();

            this.connecting = false;
        }

        if (this.connected) {
            // the socket is connected and everything appears to be working properly
            this.waitTicks = 0;

            if (this.lastOutPacketSize < 10)
                this.waitTicks = 1300;
            else if (this.lastOutPacketSize < 30)
                this.waitTicks = 3400;
            else if (this.lastOutPacketSize < 50)
                this.waitTicks = 3600;
            else if (this.lastOutPacketSize < 100)
                this.waitTicks = 3900;
            else
                this.waitTicks = 5500;

            // add on frequency delay
            this.waitTicks += this.frequencyDelayTimes * 60;

            if (this.outPackets.length && getTicks() - this.lastOutPacketTicks >= this.waitTicks) {
                if (this.outPackets.length > 7) {
                    info(`[${this.alias}] packet queue warning - there are ${this.outPackets.length} packets waiting to be sent`);
                }

                const packet = this.outPackets.shift();

                this.sendPackets(packet);

                //m_Socket->PutBytes( m_OutPackets.front( ) );
                this.lastOutPacketSize = packet.length; //m_OutPackets.front( ).size( );
                //m_OutPackets.pop( );

                // reset frequency delay (or increment it)
                if (this.frequencyDelayTimes >= 100 || getTicks() > this.lastOutPacketTicks + this.waitTicks + 500)
                    this.frequencyDelayTimes = 0;
                else
                    this.frequencyDelayTimes++;

                this.lastOutPacketTicks = getTicks();
            }

            if (getTime() - this.lastNullTime >= 60) {
                this.sendPackets(this.protocol.SEND_SID_NULL());
                this.lastNullTime = getTime();
            }
        }

        if (!this.connecting && !this.connected && this.firstConnect) {
            info(`[${this.alias}] connecting to server [${this.server}] on port 6112`);

            this.firstConnect = false;

            if (!this.connect()) {
                info(`[${this.alias}] failed to connect to server [${this.server}] on port 6112`);
            }
        }

        return this.exiting;
    }

    connect() {
        try {
            this.configureSocket();
            this.configurePlugins();

            this.socket.connect(6112, this.server);
            return true;
        } catch (e) {
            console.log('socket error');
            console.dir(e);
            return false;
        }
    }

    disconnect() {
        info(`[${this.alias}] disconnecting`);
        this.socket.end();
        this.socket.destroy();
        this.exiting = true;
        this.connecting = false;
        this.connected = false;
    }

    sendJoinChannel(channel) {
        if (this._loggedIn && this._inChat) {
            this.sendPackets(this.protocol.SEND_SID_JOINCHANNEL(channel));
        }
    }

    sendGetFriendsList() {
        if (this._loggedIn) {
            this.sendPackets(this.protocol.SEND_SID_FRIENDSLIST());
        }
    }

    sendGetClanList() {
        if (this._loggedIn) {
            this.sendPackets(this.protocol.SEND_SID_CLANMEMBERLIST());
        }
    }

    queueEnterChat() {
        if (this._loggedIn) {
            this.sendPackets(this.protocol.SEND_SID_ENTERCHAT())
        }
    }

    queueChatCommand(command: string, silent = false) {
        if (!command.length) {
            return;
        }

        if (this._loggedIn) {
            if (this._passwordHashType === 'pvpgn' && command.length > this.maxMessageLength) {
                command = command.substr(0, this.maxMessageLength);
            }

            if (command.length > 255) {
                command = command.substr(0, 255);
            }

            if (this.outPackets.length > 10) {
                info(`[${this.alias}] attempted to queue chat command [${command}] but there are too many (${this.outPackets.length}) packets queued, discarding`);
            } else {
                this.outPackets.push(this.protocol.SEND_SID_CHATCOMMAND(command));
            }

            if (!silent) {
                this.emit(BNetEvent.CHAT_COMMAND, this, command);
            }
        }
    }

    queueWhisperCommand(username: string, command: string) {
        return this.queueChatCommand(`/w ${username} ${command}`);
    }

    queueGetGameList(gameName = '', numGames = 1) {
        if (this._loggedIn) {
            if (this.outPackets.length > 10) {
                info(`[${this.alias}] attempted to queue games list but there are too many (${this.outPackets.length}) packets queued, discarding`);
            } else {
                this.outPackets.push(this.protocol.SEND_SID_GETADVLISTEX(gameName, numGames));
            }
        }
    }

    queueJoinGame(gameName: string) {
        if (this._loggedIn) {
            this.outPackets.push(this.protocol.SEND_SID_NOTIFYJOIN(gameName));
            this._inChat = false;
            this._inGame = true;
        }
    }

    isAdmin(username: string): boolean {
        return Boolean(this.admins.find((name) => name === username));
    }

    isRootAdmin(username: string): boolean {
        return this.rootAdmin === username;
    }

    get passwordHashType(): string {
        return this._passwordHashType;
    }

    get loggedIn(): boolean {
        return this._loggedIn;
    }

    set loggedIn(value: boolean) {
        this._loggedIn = value;
    }

    get inGame(): boolean {
        return this._inGame;
    }

    set inGame(value: boolean) {
        this._inGame = value;
    }

    get inChat(): boolean {
        return this._inChat;
    }

    set inChat(value: boolean) {
        this._inChat = value;
    }

    get firstChannel(): string {
        return this._firstChannel;
    }
}
