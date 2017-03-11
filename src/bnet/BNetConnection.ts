import * as net from 'net';
import * as assert from 'assert';
import * as path from 'path';
import * as EventEmitter from 'events';
import {getTicks, getTime} from './../util';
import {BytesExtract, GetLength, ByteExtractUInt32} from './../Bytes';
import {BNetProtocol, AuthState, AccountLogonProof, AccountLogon, AuthInfo} from './BNetProtocol';
import {Plugin} from '../Plugin';
import {CommandPacket} from '../CommandPacket';
import {BNCSUtil} from './../BNCSUtil';
import {create, hex} from '../Logger';
import {Config} from "../Config";
import {Friend} from "./Friend";

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
    private clientToken: Buffer = Buffer.from('\xdc\x01\xcb\x07', 'binary');

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
    private alias: string;
    private bnlsServer: string;
    private bnlsPort: number;
    private bnlsWardenCookie: string;
    private war3version: string;

    private exeVersion: string;
    private exeVersionHash: string;

    private passwordHashType: string;
    private pvpgnRealmName: string;
    private maxMessageLength: string;
    private localeID: number;
    private countryAbbrev: string;
    private country: string;
    private language: string;
    private timezone: number;
    private war3Path: string;
    private war3exePath: string;
    private stormdllPath: string;
    private gamedllPath: string;
    private keyROC: string;
    private keyTFT: string;
    private username: string;
    private password: string;
    private firstChannel: string;
    private rootAdmin: string;
    private plugins;
    private handlers;
    private waitTicks: number;
    private nls: Buffer;

    constructor(private id: number, private TFT: number, private hostPort: number, config: Config) {
        super();

        if (!config) {
            info(`empty config for battle.net connection #${this.id}`);
            return;
        }

        this.configure(config);

        if (!this.enabled) {
            return;
        }

        info(`found battle.net connection [#${this.id}] for server [${this.server}]`);

        this.on('talk', (that, event) => {
            if (event.message === '?trigger') {
                this.queueChatCommand(`Command trigger is ${this.commandTrigger}`);
            }
        });

        this.on('command', (that, argv) => {
            console.log('got command', argv);
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
        this.exeVersion = config.item('custom.exeversion', '');
        this.exeVersionHash = config.item('custom.exeversionhash', '');
        this.passwordHashType = config.item('custom.passwordhashyype', '');
        this.pvpgnRealmName = config.item('custom.pvpgnrealmname', 'PvPGN Realm');
        this.maxMessageLength = config.item('custom.maxmessagelength', '200');

        this.localeID = config.item('localeid', 1049); //Russian
        this.countryAbbrev = config.item('countryabbrev', 'RUS');
        this.country = config.item('country', 'Russia');
        this.language = config.item('language', 'ruRU');
        this.timezone = config.item('timezone', 300);

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
            this.handlers[this.protocol[type].charCodeAt(0)] = this[`HANDLE_${type}`];
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

        const bytesLength = GetLength(buffer);

        debug(`expected length ${bytesLength}`);

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
                const receiver = this.protocol.receivers[packet.id];
                const handler = this.handlers[packet.id];

                (!handler) && error(`handler for packet '${packet.id}' not found`);
                (!receiver) && error(`receiver for packet '${packet.id}' not found`);

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

    queueChatCommand(command) {
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
        }
    }

    queueWhisperCommand(user, command) {
        return this.queueChatCommand(`/w ${user} ${command}`);
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

    queueJoinGame(gameName) {
        if (this.loggedIn) {
            this.outPackets.push(this.protocol.SEND_SID_NOTIFYJOIN(gameName));
            this.inChat = false;
            this.inGame = true;
        }
    }

    isAdmin(user) {
        return Boolean(this.admins.find((name) => name === user));
    }

    isRootAdmin(user) {
        return this.rootAdmin === user;
    }

    HANDLE_SID_PING(d) {
        debug('HANDLE_SID_PING', d);
        this.emit('SID_PING', this, d);
        this.sendPackets(this.protocol.SEND_SID_PING(d));
    }

    HANDLE_SID_REQUIREDWORK() {
        debug('HANDLE_SID_REQUIREDWORK');
        return null;
    }

    HANDLE_SID_NULL() {
        debug('HANDLE_SID_NULL');
        // warning: we do not respond to NULL packets with a NULL packet of our own
        // this is because PVPGN servers are programmed to respond to NULL packets so it will create a vicious cycle of useless traffic
        // official battle.net servers do not respond to NULL packets
        return;
    }

    HANDLE_SID_AUTH_INFO(data: AuthInfo) {
        debug('HANDLE_SID_AUTH_INFO');

        // if (BNCSUtil.HELP_SID_AUTH_CHECK(
        // 		this.TFT,
        // 		this.war3Path,
        // 		this.keyROC,
        // 		this.keyTFT,
        // 		d.valueStringFormula,
        // 		d.ix86VerFileName,
        // 		this.clientToken,
        // 		d.serverToken)) {
        //
        // }

        let {exeInfo, exeVersion} = BNCSUtil.getExeInfo(this.war3exePath, BNCSUtil.getPlatform());

        if (this.exeVersion.length) {
            exeVersion = BytesExtract(this.exeVersion, 4);

            info(`[${this.alias}] using custom exe version custom.exeversion ${JSON.stringify(exeVersion.toJSON().data)}`);
        } else {
            //exeVersion = bp.pack('<I', exeVersion);
            //exeVersion = ByteInt32()

            info(`[${this.alias}] using exe version ${JSON.stringify(exeVersion.toJSON().data)}`);
        }

        let exeVersionHash;

        if (this.exeVersionHash.length) {
            exeVersionHash = BytesExtract(this.exeVersionHash, 4);

            info(`[${this.alias}] using custom exe version hash custom.exeversionhash ${JSON.stringify(exeVersionHash.toJSON().data)}`);
        } else {
            exeVersionHash = BNCSUtil.checkRevisionFlat(
                data.valueString,
                this.war3exePath,
                this.stormdllPath,
                this.gamedllPath,
                BNCSUtil.extractMPQNumber(data.ix86VerFileName)
            );

            //exeVersionHash = bp.pack('<I', exeVersionHash);

            info(`[${this.alias}] using exe version hash ${JSON.stringify(exeVersionHash.toJSON().data)}`);
        }

        const clientTokenValue = ByteExtractUInt32(this.clientToken);
        const serverTokenValue = ByteExtractUInt32(data.serverToken);

        let keyInfoROC = BNCSUtil.createKeyInfo(
            this.keyROC,
            clientTokenValue,
            serverTokenValue
        );

        let keyInfoTFT: Buffer;

        if (this.TFT) {
            keyInfoTFT = BNCSUtil.createKeyInfo(
                this.keyTFT,
                clientTokenValue,
                serverTokenValue
            );

            info(`[${this.alias}] attempting to auth as "Warcraft III: The Frozen Throne"`);
        } else {
            info(`[${this.alias}] attempting to auth as "Warcraft III: Reign of Chaos"`);
        }

        this.emit('SID_AUTH_INFO', this, data);
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

        /*
         0x000: Passed challenge
         0x100: Old game version (Additional info field supplies patch MPQ filename)
         0x101: Invalid version
         0x102: Game version must be downgraded (Additional info field supplies patch MPQ filename)
         0x0NN: (where NN is the version code supplied in SID_AUTH_INFO): Invalid version code (note that 0x100 is not set in this case).
         0x200: Invalid CD key *
         0x201: CD key in use (Additional info field supplies name of user)
         0x202: Banned key
         0x203: Wrong product

         KR_ROC_KEY_IN_USE = 513; //0x201
         KR_TFT_KEY_IN_USE = 529; //0x211

         KR_OLD_GAME_VERSION = 256;
         KR_INVALID_VERSION = 257;

         KR_MUST_BE_DOWNGRADED = 258;
         KR_INVALID_CD_KEY = 512; //0x200

         KR_BANNED_KEY = 514; //0x202
         KR_WRONG_PRODUCT = 515; //0x203
         */

        if (auth.state > 0) {
            switch (auth.state) {
                case this.protocol.KR_ROC_KEY_IN_USE:
                    error(`logon failed - ROC CD key in use by user [${auth.description}], disconnecting`);
                    break;
                case this.protocol.KR_TFT_KEY_IN_USE:
                    error(`logon failed - TFT CD key in use by user [${auth.description}], disconnecting`);
                    break;
                case this.protocol.KR_OLD_GAME_VERSION:
                    error(`logon failed - game version is too old, disconnecting`);
                    break;
                case this.protocol.KR_INVALID_VERSION:
                    error(`logon failed - game version is invalid, disconnecting`);
                    break;
                case this.protocol.KR_MUST_BE_DOWNGRADED:
                    error(`logon failed - game version must be downgraded, disconnecting`);
                    break;
                case this.protocol.KR_INVALID_CD_KEY:
                    error(`logon failed - cd key is invalid, disconnecting`);
                    break;
                case this.protocol.KR_BANNED_KEY:
                    error(`logon failed - cd key is banned, disconnecting`);
                    break;
                default:
                    error(`logon failed - cd keys not accepted, disconnecting`);
            }

            this.disconnect();
        } else {
            let clientPublicKey;

            if (!this.nls) {
                this.nls = BNCSUtil.nls_init(this.username, this.password);
            }

            clientPublicKey = BNCSUtil.nls_get_A(this.nls);

            if (clientPublicKey.length !== 32) { // retry since bncsutil randomly fails
                this.nls = BNCSUtil.nls_init(this.username, this.password);
                clientPublicKey = BNCSUtil.nls_get_A(this.nls);

                assert(clientPublicKey.length === 32, 'client public key wrong length');
            }

            info(`[${this.alias}] cd keys accepted`);

            this.emit('SID_AUTH_CHECK', this, auth);
            this.sendPackets(this.protocol.SEND_SID_AUTH_ACCOUNTLOGON(clientPublicKey, this.username));
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

        /*
         0x00: Logon successful.
         0x02: Incorrect password.
         0x0E(14): An email address should be registered for this account.
         0x0F(15): Custom error. A string at the end of this message contains the error.
         */

        if (logon.status > 0) {
            switch (logon.status) {
                case 2:
                    error('logon proof failed - incorrect password');
                    return;
                case 14:
                    error('logon proof failed - an email address should be registered for this account');
                    return;
                case 15:
                    error(`logon proof failed - ${logon.message}`);
                    return;
                default:
                    error(`logon proof failed - rejected with status ${logon.status}`);
                    return;
            }
        }

        this.loggedIn = true;

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

    HANDLE_SID_CHATEVENT(d) {
        debug('HANDLE_SID_CHATEVENT');

        this.emit('SID_CHATEVENT', this, d);
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

    HANDLE_SID_MESSAGEBOX(d) {
        debug('HANDLE_SID_MESSAGEBOX');
    }

    HANDLE_SID_FRIENDSLIST(friends: Friend[]) {
        debug('HANDLE_SID_FRIENDSLIST');

        this.emit('SID_FRIENDSLIST', this, friends);
    }

    HANDLE_SID_GETADVLISTEX(d) {

    }
}