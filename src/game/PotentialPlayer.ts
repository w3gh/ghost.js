'use strict';

// import hex from 'hex';
import * as net from 'net';
import {GetLength} from '../Bytes';
import {GameProtocol} from './GameProtocol';
import {CommandPacket} from '../CommandPacket';
import {Protocol} from '../Protocol';

import {createLoggerFor, hex} from '../Logger';
import {BaseGame} from "./BaseGame";
import {IncomingJoinPlayer} from './IncomingJoinPlayer';

const {debug, info, error} = createLoggerFor('PotentialPlayer');

export class PotentialPlayer extends Protocol {
    protected isError: string = null;
    protected errorString: string = null;
    protected isDeleteMe: boolean = false;
    protected incomingJoinPlayer: IncomingJoinPlayer;
    protected incomingPackets: CommandPacket[] = [];
    protected incomingBuffer: Buffer = Buffer.from('');

    constructor(public protocol: GameProtocol, public game: BaseGame, public socket: net.Socket) {
        super();

        this.socketSetup();
    }

    socketSetup() {
        this.socket
            .on('lookup', this.onLookup)
            .on('connect', this.onConnect)
            .on('data', this.onData)
            .on('end', this.onEnd)
            .on('timeout', this.onTimeout)
            .on('drain', this.onDrain)
            .on('error', this.onError)
            .on('close', this.onClose);
    }

    onLookup = (...args) => {
        info('lookup', ...args);
    };

    onConnect = (...args) => {
        info('connect', ...args);
    };

    onData = (buffer) => {
        info('data');
        hex(buffer);

        this.incomingBuffer = Buffer.concat([this.incomingBuffer, buffer]);

        this.extractPackets();
        this.processPackets();
    };

    onEnd = (...args) => {
        info('end', ...args);
    };

    onTimeout = (...args) => {
        info('timeout', ...args);
    };

    onDrain = (...args) => {
        info('drain', ...args);
    };

    onError = (...args) => {
        info('error', ...args);
    };

    onClose = (...args) => {
        info('close', ...args);
    };

    setDeleteMe(value: boolean) {
        this.isDeleteMe = value;

        return this
    }

    setSocket(value: net.Socket | null) {
        this.socket = value;

        return this
    }

    getExternalIP() {
        return this.socket.localAddress.replace('::ffff:', '')
    }

    getExternalPort() {
        return this.socket.localPort
    }

    getJoinPlayer() {
        return this.incomingJoinPlayer
    }

    extractPackets() {
        /*
        000000   F7 1E 2E 00 01 00 00 00 00 00 00 00 00 E0 17 01   ÷............à..
        000010   00 00 00 4A 45 4C 45 5A 4F 52 54 00 01 00 02 00   ...JELEZORT.....
        000020   17 E0 C0 A8 01 68 00 00 00 00 00 00 00 00         .àÀ¨.h........
         */

        if (!this.socket) {
            return
        }

        let lengthProcessed = 0;

        // a packet is at least 4 bytes so loop as long as the buffer contains 4 bytes
        while (this.incomingBuffer.length >= 4) {
            const buffer = this.incomingBuffer;

            if (!this.protocol.haveHeader(buffer)) {
                error('received invalid packet from player (bad header constant), disconnecting');
                return;
            }

            const bytesLength = GetLength(buffer);

            if (bytesLength < 4) {
                error('received invalid packet from player (bad length)');
                return;
            }

            if (buffer.length >= bytesLength) {
                this.incomingPackets.push(
                    new CommandPacket(buffer[0], buffer[1], buffer.slice(0, bytesLength))
                );

                this.incomingBuffer = buffer.slice(bytesLength);

                lengthProcessed += bytesLength
            } else { // still waiting for rest of the packet
                error("received invalid packet from player (bad length)");
                return;
            }
        }
    }

    processPackets() {
        while (this.incomingPackets.length) {
            const packet = this.incomingPackets.pop();

            if (packet.type === this.protocol.W3GS_HEADER_CONSTANT) {
                if (packet.id === this.protocol.W3GS_REQJOIN) {
                    this.incomingJoinPlayer = null;
                    this.incomingJoinPlayer = this.protocol.RECEIVE_W3GS_REQJOIN(packet.buffer);

                    if (this.incomingJoinPlayer) {
                        this.game.emit(BaseGame.EVENT_PLAYER_JOINED, this, this.incomingJoinPlayer);
                    }

                    // don't continue looping because there may be more packets waiting and this parent class doesn't handle them
                    // EventPlayerJoined creates the new player, NULLs the socket, and sets the delete flag on this object so it'll be deleted shortly
                    // any unprocessed packets will be copied to the new CGamePlayer in the constructor or discarded if we get deleted because the game is full
                    break;
                }
            }
        }
    }

    update() {
        if (this.isDeleteMe)
            return true;

        if (!this.socket)
            return false;

        return this.isDeleteMe
    }

    send(buffer: Buffer) {
        this.socket.write(buffer);
    }

    disconnect() {
        info(`disconnecting`);
        this.socket.end();
        this.socket.destroy();
    }
}
