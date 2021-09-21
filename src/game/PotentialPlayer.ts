'use strict';

// import hex from 'hex';
import {GetLength} from '../Bytes';
import {GameProtocol, W3GSPacket} from './GameProtocol';
import {Protocol} from '../Protocol';

import {createLoggerFor, hex} from '../Logger';
import {BaseGame} from "./BaseGame";
import {IncomingJoinPlayer} from './IncomingJoinPlayer';


export class PotentialPlayer extends Protocol {
    protected isError: string = null;
    protected errorString: string = null;
    protected isDeleteMe: boolean = false;
    protected incomingJoinPlayer: IncomingJoinPlayer;
    protected incomingBuffer: Buffer = Buffer.from('');
    protected debug: Function;
    protected info: Function;
    protected error: Function;

    constructor(public protocol: GameProtocol, public game: BaseGame, public socketId: number) {
        super();
        const {debug, info, error} = createLoggerFor(this.constructor.name);
        this.debug = debug;
        this.info = info;
        this.error = error;
    }

    onLookup = (...args) => {
        this.info('lookup', ...args);
    };

    onConnect = (...args) => {
        this.info('connect', ...args);
    };

    onData = (buffer) => {
        this.info('data');
        hex(buffer);

        this.incomingBuffer = Buffer.concat([this.incomingBuffer, buffer]);

        this.extractPackets();
    };

    onEnd = (...args) => {
        debugger
        this.info('end', ...args);
    };

    onTimeout = (...args) => {
        this.info('timeout', ...args);
    };

    onDrain = (...args) => {
        this.info('drain', ...args);
    };

    onError = (err: Error) => {
        this.errorString = err.toString();
        this.info('error', err);
    };

    onClose = (had_error: boolean) => {
        const withError = `width error  ${this.errorString}`;

        this.info(`closed connection ${had_error ? withError: ''}`);
    };

    setDeleteMe(value: boolean) {
        this.isDeleteMe = value;

        return this
    }

    private getSocket() {
        return this.game.getSocket(this.socketId)
    }

    getExternalIP() {
        return this.getSocket().remoteAddress.replace('::ffff:', '')
    }

    getInternalIP() {
        return this.getSocket().localAddress.replace('::ffff:', '')
    }

    getExternalPort() {
        return this.getSocket().localPort
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

        if (!this.getSocket()) {
            return
        }

        let lengthProcessed = 0;

        // a packet is at least 4 bytes so loop as long as the buffer contains 4 bytes
        while (this.incomingBuffer.length >= 4) {
            const buffer = this.incomingBuffer;

            if (!this.protocol.haveHeader(buffer)) {
                this.error('received invalid packet from player (bad header constant), disconnecting');
                return;
            }

            const bytesLength = GetLength(buffer);

            if (bytesLength < 4) {
                this.error('received invalid packet from player (bad length)');
                return;
            }

            if (buffer.length >= bytesLength) {
                this.processPacket(buffer[0], buffer[1], buffer.slice(0, bytesLength));

                this.incomingBuffer = buffer.slice(bytesLength);

                lengthProcessed += bytesLength
            } else { // still waiting for rest of the packet
                this.error("received invalid packet from player (bad length)");
                return;
            }
        }
    }

    protected processPacket(type: number, id: number, buffer: Buffer) {
        if (type === W3GSPacket.W3GS_HEADER_CONSTANT) {
            this.debug('processPacket', id, buffer);

            if (this[id]) {
                this[id](buffer)
            }
        }
    }

    [W3GSPacket.W3GS_REQJOIN] = (buffer: Buffer) => {
        this.debug('W3GS_REQJOIN');
        const incomingJoinPlayer = this.protocol.RECEIVE_W3GS_REQJOIN(buffer);

        if (incomingJoinPlayer) {
            this.game.emit(BaseGame.EVENT_PLAYER_JOINED, this, incomingJoinPlayer);
        }
    };

    update() {
        if (this.isDeleteMe)
            return true;

        if (!this.getSocket())
            return false;

        return this.isDeleteMe
    }

    send(buffer: Buffer) {
        this.getSocket().write(buffer);
    }
}
