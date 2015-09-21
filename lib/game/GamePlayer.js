'use strict';

import util from 'util';
import hex from 'hex';
import net from 'net';
import _ from 'lodash';
import bp from 'bufferpack';
import log from './../log';
import { ByteHeader } from './../Bytes';
import GameProtocol from './GameProtocol';
import CommandPacket from '../CommandPacket';
import Protocol from '../Protocol';

/**
 * Potential connecting player
 * @param {GameProtocol} protocol
 * @param {BaseGame} game
 * @param {net.Socket} socket
 * @constructor
 */
export class PotentialPlayer extends Protocol {
	constructor(protocol, game, socket) {
		super(protocol, game, socket);

		this.deleteMe = false;
		this.game = game;
		this.socket = socket;
		this.protocol = protocol;
		this.packets = [];

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
		log('PotentialPlayer lookup', arguments);
	}

	onConnect() {
		log('PotentialPlayer connect', arguments);
	}

	onData(buffer) {
		log('PotentialPlayer data');
		hex(buffer);

		this.extractPackets(buffer);
		this.processPackets();
	}

	onEnd() {
		log('PotentialPlayer end');
	}

	onTimeout() {
		log('PotentialPlayer timeout', arguments);
	}

	onDrain() {
		log('PotentialPlayer drain', arguments);
	}

	onError() {
		log('PotentialPlayer error', arguments);
	}

	onClose() {
		log('PotentialPlayer close', arguments);
	}

	setDeleteMe(value) {
		this.deleteMe = value;
	}

	getExternalIP() {
		var zeros = [0, 0, 0, 0];
	}

	getInternalIP() {

	}

	extractPackets(buffer) {
		var len = this.getLength(buffer);

		if (ByteHeader(buffer) !== GameProtocol.W3GS_HEADER_CONSTANT) {
			log('error - received invalid packet from player (bad header constant)');
			this.socket.end();
		}

		if (len < 4) {
			log('error - received invalid packet from player (bad length)');
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

			if (packet.type === GameProtocol.W3GS_HEADER_CONSTANT) {
				switch (packet.id) {
					case GameProtocol.W3GS_REQJOIN:
						delete this.incomingJoinPlayer;
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

export class GamePlayer extends PotentialPlayer {
	constructor(protocol, game, socket) {
		super(protocol, game, socket);

		this.isLeftMessageSent = false;
	}
}