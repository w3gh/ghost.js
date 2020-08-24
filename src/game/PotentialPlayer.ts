'use strict';

// import hex from 'hex';
import * as net from 'net';
import {ByteHeader, GetLength} from '../Bytes';
import {GameProtocol} from './GameProtocol';
import {CommandPacket} from '../CommandPacket';
import {Protocol} from '../Protocol';

import {createLoggerFor, hex} from '../Logger';
import {BaseGame} from "./BaseGame";

const {debug, info, error} = createLoggerFor('PotentialPlayer');

/**
 * Potential connecting player
 * @param {GameProtocol} protocol
 * @param {BaseGame} game
 * @param {net.Socket} socket
 * @constructor
 */
export class PotentialPlayer extends Protocol {
    private deleteMe: boolean = false;
    private incomingJoinPlayer;
    private incomingPackets: CommandPacket[] = [];
    private incomingBuffer: Buffer = Buffer.from('');

    constructor(public protocol: GameProtocol, public game: BaseGame, public socket: net.Socket) {
        super();

        this.socketSetup();
    }

    /**
     * @param {Buffer} buffer
     */
    send(buffer: Buffer) {
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
        info('lookup', arguments);
    }

    onConnect() {
        info('connect', arguments);
    }

    onData(buffer) {
        info('data');
        hex(buffer);

        this.incomingBuffer = Buffer.concat([this.incomingBuffer, buffer]);

        this.extractPackets();
        this.processPackets();
    }

    onEnd() {
        info('end');
    }

    onTimeout() {
        info('timeout', arguments);
    }

    onDrain() {
        info('drain', arguments);
    }

    onError() {
        info('error', arguments);
    }

    onClose() {
        info('close', arguments);
    }

    setDeleteMe(value) {
        this.deleteMe = value;
    }

    getExternalIP() {
        return this.socket.address().toString()
    }

    getInternalIP() {

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
        let packet;

        /*
if( !m_Socket )
		return;

	// process all the received packets in the m_Packets queue

	while( !m_Packets.empty( ) )
	{
		CCommandPacket *Packet = m_Packets.front( );
		m_Packets.pop( );

		if( Packet->GetPacketType( ) == W3GS_HEADER_CONSTANT )
		{
			// the only packet we care about as a potential player is W3GS_REQJOIN, ignore everything else

			switch( Packet->GetID( ) )
			{
			case CGameProtocol :: W3GS_REQJOIN:
				delete m_IncomingJoinPlayer;
				m_IncomingJoinPlayer = m_Protocol->RECEIVE_W3GS_REQJOIN( Packet->GetData( ) );

				if( m_IncomingJoinPlayer )
					m_Game->EventPlayerJoined( this, m_IncomingJoinPlayer );

				// don't continue looping because there may be more packets waiting and this parent class doesn't handle them
				// EventPlayerJoined creates the new player, NULLs the socket, and sets the delete flag on this object so it'll be deleted shortly
				// any unprocessed packets will be copied to the new CGamePlayer in the constructor or discarded if we get deleted because the game is full

				delete Packet;
				return;
			}
		}

		delete Packet;
	}
         */

        while (this.incomingPackets.length) {
            const packet = this.incomingPackets.pop();

            if (packet.type === this.protocol.W3GS_HEADER_CONSTANT) {
                // const receiver = this.packetReceiver[packet.id], // this.protocol.receivers[packet.id],
                //     handler = this.packetHandler[packet.id]; // this.handlers[packet.id];
                //
                // if (!handler || !receiver) {
                //     (!handler) && error(`handler for packet '${packet.id}' not found`);
                //     (!receiver) && error(`receiver for packet '${packet.id}' not found`);
                //
                //     continue;
                // }
                //
                // handler && receiver && handler(this, this.protocol, receiver(packet.buffer));

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

    update() {
        if (this.deleteMe)
            return true;

        if (!this.socket)
            return false;

        return this.deleteMe
    }

    disconnect() {
        info(`disconnecting`);
        this.socket.end();
        this.socket.destroy();
    }
}
