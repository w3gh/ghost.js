import * as net from 'net';
import * as assert from 'assert';
import * as path from 'path';
import * as EventEmitter from 'events';
import {getTicks, getTime} from '../util';
import {BytesExtract, GetLength, ByteExtractUInt32} from '../Bytes';
import {BNetProtocol} from './BNetProtocol';
import {Plugin} from '../Plugin';
import {CommandPacket} from '../CommandPacket';
import {BNCSUtil} from '../BNCSUtil';
import {create, hex} from '../Logger';
import {Config} from "../Config";
import {IncomingFriend} from "./IncomingFriend";
import {IncomingChatEvent} from "./IncomingChatEvent";
import {AuthInfo} from "./AuthInfo";
import {AuthState} from "./AuthState";
import {AccountLogon} from "./AccountLogon";
import {AccountLogonProof} from "./AccountLogonProof";

const {debug, info, error} = create('BNet');

/**
 * Class for connecting to battle.net
 * @param {Object} options
 * @constructor
 */
export class BNetConnection extends EventEmitter {
    private enabled: boolean;
    private socket: net.Socket = new net.Socket();
    private protocol: BNetProtocol = new BNetProtocol(this);

    private bncs: BNCSUtil = new BNCSUtil();
    private data: Buffer = Buffer.from('');
    private incomingPackets: CommandPacket[] = [];
    private incomingBuffer: Buffer = Buffer.from('');
    public readonly clientToken: Buffer = Buffer.from('\xdc\x01\xcb\x07', 'binary');

    private admins: string[] = [];
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
    private loggedIn: boolean = false;
    private inChat: boolean = false;
    private inGame: boolean = false;
    private commandTrigger: string;
    private server: string;
    public alias: string;
    private bnlsServer: string;
    private bnlsPort: number;
    private bnlsWardenCookie: string;
    private war3version: string;

    public readonly exeVersion: string;
    public readonly exeVersionHash: string;

    private passwordHashType: string;
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
    private firstChannel: string;
    private rootAdmin: string;
    private plugins;
    private handlers;
    private waitTicks: number;
    nls: Buffer;

    constructor(private id: number, public readonly TFT: number, private hostPort: number, config: Config) {
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

        this.passwordHashType = config.item('custom.passwordhashyype', '');
        this.pvpgnRealmName = config.item('custom.pvpgnrealmname', 'PvPGN Realm');
        this.maxMessageLength = Number(config.item('custom.maxmessagelength', '200'));

        this.localeID = config.item('localeid', 1049); //Russian
        this.countryAbbrev = config.item('countryabbrev', 'RUS');
        this.country = config.item('country', 'Russia');
        this.language = config.item('language', 'ruRU');
        this.timezone = config.item('timezone', 300);

        this.firstChannel = config.item('firstchannel', 'The Void');
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
                this.loggedIn = false;
                this.inChat = false;
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

    configureHandlers() {
        this.handlers = {};

        for (let type of [
            'SID_PING',
            'SID_AUTH_INFO',
            'SID_AUTH_CHECK',
            'SID_AUTH_ACCOUNTLOGON',
            'SID_AUTH_ACCOUNTLOGONPROOF',
            'SID_REQUIREDWORK',
            'SID_NULL',
            'SID_ENTERCHAT',
            'SID_CHATEVENT',
            'SID_CLANINFO',
            'SID_CLANMEMBERLIST',
            'SID_CLANMEMBERSTATUSCHANGE',
            'SID_MESSAGEBOX',
            'SID_CLANINVITATION',
            'SID_CLANMEMBERREMOVED',
            'SID_FRIENDSUPDATE',
            'SID_FRIENDSLIST',
            'SID_FLOODDETECTED',
            'SID_FRIENDSADD',
            'SID_GETADVLISTEX'
        ]) {
            this.handlers[this.protocol[type]] = this[`HANDLE_${type}`];
        }
    }

    configurePlugins() {
        Plugin.emit('onBNetInit', this);
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
        while (this.incomingBuffer.length >= 4) {
            const buffer = this.incomingBuffer;

            if (!this.protocol.haveHeader(buffer)) {
                error('received invalid packet from battle.net (bad header constant), disconnecting');
                this.disconnect();
                return;
            }

            const bytesLength = GetLength(buffer);

            if (bytesLength >= 4) {
                if (buffer.length >= bytesLength) {
                    this.incomingPackets.push(
                        new CommandPacket(
                            this.protocol.BNET_HEADER_CONSTANT,
                            buffer[1],
                            buffer.slice(0, bytesLength)
                        )
                    );

                    this.incomingBuffer = buffer.slice(bytesLength);
                } else { // still waiting for rest of the packet
                    return;
                }
            } else {
                error('received invalid packet from battle.net (bad length), disconnecting');
                return;
            }
        }
    }

    processPackets() {
        while (this.incomingPackets.length) {
            const packet = this.incomingPackets.pop();

            if (packet.type === this.protocol.BNET_HEADER_CONSTANT) {
                const receiver = this.protocol.receivers[packet.id],
                    handler = this.handlers[packet.id];

                if (!handler || !receiver) {
                    (!handler) && error(`handler for packet '${packet.id}' not found`);
                    (!receiver) && error(`receiver for packet '${packet.id}' not found`);

                    continue;
                }

                handler && receiver && handler.call(this, receiver.call(this.protocol, packet.buffer));
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

            this.configureHandlers();
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
        this.socket.end();
        this.exiting = true;
        this.connecting = false;
        this.connected = false;
    }

    sendJoinChannel(channel) {
        if (this.loggedIn && this.inChat) {
            this.sendPackets(this.protocol.SEND_SID_JOINCHANNEL(channel));
        }
    }

    sendGetFriendsList() {
        if (this.loggedIn) {
            this.sendPackets(this.protocol.SEND_SID_FRIENDSLIST());
        }
    }

    sendGetClanList() {
        if (this.loggedIn) {
            this.sendPackets(this.protocol.SEND_SID_CLANMEMBERLIST());
        }
    }

    queueEnterChat() {
        // if( m_LoggedIn )
        // m_OutPackets.push( m_Protocol->SEND_SID_ENTERCHAT( ) );
    }

    queueChatCommand(command: string, silent = false) {
        if (!command.length) {
            return;
        }

        if (this.loggedIn) {
            if (this.passwordHashType === 'pvpgn' && command.length > this.maxMessageLength) {
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
                this.emit('chatCommand', this, command);
            }
        }
    }

    queueWhisperCommand(username: string, command: string) {
        return this.queueChatCommand(`/w ${username} ${command}`);
    }

    queueGetGameList(gameName = '', numGames = 1) {
        if (this.loggedIn) {
            if (this.outPackets.length > 10) {
                info(`[${this.alias}] attempted to queue games list but there are too many (${this.outPackets.length}) packets queued, discarding`);
            } else {
                this.outPackets.push(this.protocol.SEND_SID_GETADVLISTEX(gameName, numGames));
            }
        }
    }

    queueJoinGame(gameName: string) {
        if (this.loggedIn) {
            this.outPackets.push(this.protocol.SEND_SID_NOTIFYJOIN(gameName));
            this.inChat = false;
            this.inGame = true;
        }
    }

    isAdmin(username: string): boolean {
        return Boolean(this.admins.find((name) => name === username));
    }

    isRootAdmin(username: string): boolean {
        return this.rootAdmin === username;
    }

    HANDLE_SID_PING(d) {
        debug('HANDLE_SID_PING', d);
        this.emit('SID_PING', this, d);
        this.sendPackets(this.protocol.SEND_SID_PING(d));
    }

    HANDLE_SID_NULL() {
        debug('HANDLE_SID_NULL');
        // warning: we do not respond to NULL packets with a NULL packet of our own
        // this is because PVPGN servers are programmed to respond to NULL packets so it will create a vicious cycle of useless traffic
        // official battle.net servers do not respond to NULL packets
        return;
    }

    HANDLE_SID_AUTH_INFO(authInfo: AuthInfo) {
        debug('HANDLE_SID_AUTH_INFO');

        const {
            exeVersion,
            exeVersionHash,
            keyInfoROC,
            keyInfoTFT,
            exeInfo
        } = authInfo.handle(this);

        this.emit('SID_AUTH_INFO', this, authInfo);
        this.sendPackets(this.protocol.SEND_SID_AUTH_CHECK(
            this.TFT,
            this.clientToken,
            exeVersion,
            exeVersionHash,
            keyInfoROC,
            keyInfoTFT,
            exeInfo,
            this.username
        ));
    }

    HANDLE_SID_AUTH_CHECK(auth: AuthState) {
        debug('HANDLE_SID_AUTH_CHECK');

        if (auth.isValid()) {
            let clientPublicKey = auth.createClientPublicKey(this);

            info(`[${this.alias}] cd keys accepted`);

            this.emit('SID_AUTH_CHECK', this, auth);
            this.sendPackets(this.protocol.SEND_SID_AUTH_ACCOUNTLOGON(clientPublicKey, this.username));
        } else {
            this.disconnect();
        }
    }

    HANDLE_SID_AUTH_ACCOUNTLOGON(logon: AccountLogon) {
        debug('HANDLE_SID_AUTH_ACCOUNTLOGON');

        if (logon.status > 0) {
            switch (logon.status) {
                case 1:
                    error(`logon failed - account doesn't exist`);
                    return;
                case 5:
                    error(`logon failed - account requires upgrade`);
                    return;
                default:
                    error(`logon failed - proof rejected with status ${logon.status}`);
                    return;
            }
        }

        info(`[${this.alias}] username ${this.username} accepted`);

        let data;

        if (this.passwordHashType === 'pvpgn') {
            info(`[${this.alias}] using pvpgn logon type (for pvpgn servers only)`);

            data = this.protocol.SEND_SID_AUTH_ACCOUNTLOGONPROOF(
                BNCSUtil.hashPassword(this.password)
            );

        } else {
            info(`[${this.alias}] using battle.net logon type (for official battle.net servers only)`);

            data = this.protocol.SEND_SID_AUTH_ACCOUNTLOGONPROOF(
                BNCSUtil.nls_get_M1(this.nls, logon.serverPublicKey, logon.salt)
            );
        }

        this.emit('SID_AUTH_ACCOUNTLOGON', this, logon);
        this.sendPackets(data);
    }

    HANDLE_SID_AUTH_ACCOUNTLOGONPROOF(logon: AccountLogonProof) {
        debug('HANDLE_SID_AUTH_ACCOUNTLOGONPROOF');

        this.loggedIn = logon.isValid();

        info(`[${this.alias}] logon successful`);

        this.emit('SID_AUTH_ACCOUNTLOGONPROOF', this, logon);
        this.sendPackets([
            this.protocol.SEND_SID_NETGAMEPORT(this.hostPort),
            this.protocol.SEND_SID_ENTERCHAT(),
            this.protocol.SEND_SID_FRIENDSLIST(),
            this.protocol.SEND_SID_CLANMEMBERLIST(),
        ]);
    }

    HANDLE_SID_ENTERCHAT(d) {
        debug('HANDLE_SID_ENTERCHAT');

        if ('#' === d.toString()[0]) {
            debug('warning: account already logged in.');
        }

        info(`[${this.alias}] joining channel [${this.firstChannel}]`);

        this.inChat = true;

        this.emit('SID_ENTERCHAT', this, d);
        this.sendPackets(this.protocol.SEND_SID_JOINCHANNEL(this.firstChannel));
    }

    HANDLE_SID_CHATEVENT(e: IncomingChatEvent) {
        debug('HANDLE_SID_CHATEVENT', e.idType(), e.user, e.message);

        this.emit('SID_CHATEVENT', this, e);
    }

    HANDLE_SID_CLANINFO() {
        debug('HANDLE_SID_CLANINFO');
    }

    HANDLE_SID_CLANMEMBERLIST() {
        debug('HANDLE_SID_CLANMEMBERLIST');
    }

    HANDLE_SID_CLANMEMBERSTATUSCHANGE() {
        debug('HANDLE_SID_CLANMEMBERSTATUSCHANGE');
    }

    HANDLE_SID_FRIENDSLIST(friends: IncomingFriend[]) {
        debug('HANDLE_SID_FRIENDSLIST');

        this.emit('SID_FRIENDSLIST', this, friends);
    }

    HANDLE_SID_GETADVLISTEX(d) {

    }
}
