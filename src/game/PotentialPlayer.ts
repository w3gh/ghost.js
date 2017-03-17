'use strict';

// import hex from 'hex';
import * as net from 'net';
import {ByteHeader} from './../Bytes';
import {GameProtocol} from './GameProtocol';
import {CommandPacket} from '../CommandPacket';
import {Protocol} from '../Protocol';

import {create, hex} from '../Logger';
import {BaseGame} from "./BaseGame";

const {debug, info, error} = create('GamePlayer');

/**
 * Potential connecting player
 * @param {GameProtocol} protocol
 * @param {BaseGame} game
 * @param {net.Socket} socket
 * @constructor
 */
export class PotentialPlayer extends Protocol {
    private deleteMe: boolean = false;
    private packets: CommandPacket[] = [];
    private incomingJoinPlayer;

    constructor(public protocol: GameProtocol, public game: BaseGame, public socket: net.Socket) {
        super();

        this.socketSetup();
    }

    /**
     * @param {Buffer} buffer
     */
    send(buffer) {
        this.socket.write(buffer);
    }

    socketSetup() {
        this.socket.on('lookup', this.onLookup.bind(this));
        this.socket.on('connect', this.onConnect.bind(this));
        this.socket.on('data', this.onData.bind(this));
        this.socket.on('end', this.onEnd.bind(this));
        this.socket.on('timeout', this.onTimeout.bind(this));
        this.socket.on('drain', this.onDrain.bind(this));

        this.socket.on('error', this.onError.bind(this));
        this.socket.on('close', this.onClose.bind(this));
    }

    onLookup() {
        info('PotentialPlayer lookup', arguments);
    }

    onConnect() {
        info('PotentialPlayer connect', arguments);
    }

    onData(buffer) {
        info('PotentialPlayer data');
        hex(buffer);

        this.extractPackets(buffer);
        this.processPackets();
    }

    onEnd() {
        info('PotentialPlayer end');
    }

    onTimeout() {
        info('PotentialPlayer timeout', arguments);
    }

    onDrain() {
        info('PotentialPlayer drain', arguments);
    }

    onError() {
        info('PotentialPlayer error', arguments);
    }

    onClose() {
        info('PotentialPlayer close', arguments);
    }

    setDeleteMe(value) {
        this.deleteMe = value;
    }

    getExternalIP() {
        var zeros = [0, 0, 0, 0];
    }

    getInternalIP() {

    }

    getLength(buffer: Buffer) {
        return 0;
    }

    extractPackets(buffer) {
        var len = this.getLength(buffer);

        if (ByteHeader(buffer) !== Number(this.protocol.W3GS_HEADER_CONSTANT)) {
            info('error - received invalid packet from player (bad header constant)');
            this.socket.end();
        }

        if (len < 4) {
            info('error - received invalid packet from player (bad length)');
            this.socket.end();
        }

        if (buffer.length >= len) {
            this.packets.push(new CommandPacket(buffer[0], buffer[1], buffer));
            this.buffer = buffer.slice(len);
        }
    }

    processPackets() {
        var packet;

        while (this.packets.length) {
            packet = this.packets.pop();

            if (packet.type === this.protocol.W3GS_HEADER_CONSTANT) {
                switch (packet.id) {
                    case this.protocol.W3GS_REQJOIN:
                        this.incomingJoinPlayer = null;
                        this.incomingJoinPlayer = this.protocol.RECEIVE_W3GS_REQJOIN(packet.buffer);

                        if (this.incomingJoinPlayer) {
                            this.game.emit('player.joined', this, this.incomingJoinPlayer);
                        }

                        // don't continue looping because there may be more packets waiting and this parent class doesn't handle them
                        // EventPlayerJoined creates the new player, NULLs the socket, and sets the delete flag on this object so it'll be deleted shortly
                        // any unprocessed packets will be copied to the new CGamePlayer in the constructor or discarded if we get deleted because the game is full
                        break;
                }
            }
        }
    }
}
