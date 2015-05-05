'use strict';

var log = require('./../log');
var Bytes = require('./../Bytes');
var net = require('net');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
var GameProtocol = require('./GameProtocol');
var GameMap = require('./Map');
var GamePlayer = require('./GamePlayer');
var GAME_REHOST_INTERVAL = 5000;

function BaseGame(ghost, map, saveGame, hostPort, gameState, gameName, ownerName, creatorName, creatorServer) {
	EventEmitter.call(this);

	this.ghost = ghost;
	this.socket = new net.Server();
	this.protocol = new GameProtocol();
	this.map = (map instanceof GameMap) ? map : new GameMap(map);

	this.potentials = [];
	this.players = [];

	this.exiting = false;
	this.saving = false;
	this.hostCounter = ghost.hostCounter++;
	this.hostPort = hostPort;
	this.gameState = gameState;
	this.virtualHostPID = 255;
	this.fakePlayerPID = 255;
	this.gameName = gameName;
	this.lastGameName = gameName;
	this.virtualHostName = 'Map';
	this.ownerName = ownerName;

	creatorName = creatorName || 'Varlock';
	this.creatorName = creatorName;
	this.creatorServer = creatorServer;

	this.socketServerSetup(hostPort);

	this.countDownStarted = false;

	this.lastPingTime = Date.now();
	this.lastRefreshTime = Date.now();
	this.creationTime = Date.now();

	this.on('player.joined', this.onPlayerJoined.bind(this));
}

util.inherits(BaseGame, EventEmitter);

_.extend(BaseGame.prototype, {

	/**
	 * @param {PotentialPlayer} potentialPlayer
	 * @param {IncomingJoinPlayer} joinPlayer
	 */
	onPlayerJoined: function (potentialPlayer, joinPlayer) {
		log('BaseGame player joined', arguments);

		// check if the new player's name is empty or too long
		if (!joinPlayer.name.length || joinPlayer.name.length > 15) {
			potentialPlayer.send(this.protocol.SEND_W3GS_REJECTJOIN(GameProtocol.REJECTJOIN_FULL));
		}

		// check if the new player's name is the same as the virtual host name
		if (joinPlayer.name === this.virtualHostName) {
			potentialPlayer.send(this.protocol.SEND_W3GS_REJECTJOIN(GameProtocol.REJECTJOIN_FULL));
			potentialPlayer.setDeleteMe(true);
			return null;
		}

		// check if the new player's name is already taken
		if (this.getPlayerFromName(joinPlayer.name, false)) {
			potentialPlayer.send(this.protocol.SEND_W3GS_REJECTJOIN(GameProtocol.REJECTJOIN_FULL));
			potentialPlayer.setDeleteMe(true);
			return null;
		}

		// try to find a slot
		var SID = 255;
		var EnforcePID = 255;
		var EnforceSID = 0;

		var gameSlot = [255, 0, 0, 0, 0, 0, 0];

		// try to find an empty slot

		SID = this.getEmptySlot(false);

		/**
		 // try to find an empty slot

		 SID = GetEmptySlot( false );

		 if( SID == 255 && Reserved )
		 {
			// a reserved player is trying to join the game but it's full, try to find a reserved slot

			SID = GetEmptySlot( true );

			if( SID != 255 )
			{
				CGamePlayer *KickedPlayer = GetPlayerFromSID( SID );

				if( KickedPlayer )
				{
					KickedPlayer->SetDeleteMe( true );
					KickedPlayer->SetLeftReason( m_GHost->m_Language->WasKickedForReservedPlayer( joinPlayer->GetName( ) ) );
					KickedPlayer->SetLeftCode( PLAYERLEAVE_LOBBY );

					// send a playerleave message immediately since it won't normally get sent until the player is deleted which is after we send a playerjoin message
					// we don't need to call OpenSlot here because we're about to overwrite the slot data anyway

					SendAll( m_Protocol->SEND_W3GS_PLAYERLEAVE_OTHERS( KickedPlayer->GetPID( ), KickedPlayer->GetLeftCode( ) ) );
					KickedPlayer->SetLeftMessageSent( true );
				}
			}
		}

		 if( SID == 255 && IsOwner( joinPlayer->GetName( ) ) )
		 {
			// the owner player is trying to join the game but it's full and we couldn't even find a reserved slot, kick the player in the lowest numbered slot
			// updated this to try to find a player slot so that we don't end up kicking a computer

			SID = 0;

						for( unsigned char i = 0; i < m_Slots.size( ); ++i )
			{
				if( m_Slots[i].GetSlotStatus( ) == SLOTSTATUS_OCCUPIED && m_Slots[i].GetComputer( ) == 0 )
				{
					SID = i;
					break;
				}
			}

			CGamePlayer *KickedPlayer = GetPlayerFromSID( SID );

			if( KickedPlayer )
			{
				KickedPlayer->SetDeleteMe( true );
				KickedPlayer->SetLeftReason( m_GHost->m_Language->WasKickedForOwnerPlayer( joinPlayer->GetName( ) ) );
				KickedPlayer->SetLeftCode( PLAYERLEAVE_LOBBY );

				// send a playerleave message immediately since it won't normally get sent until the player is deleted which is after we send a playerjoin message
				// we don't need to call OpenSlot here because we're about to overwrite the slot data anyway

				SendAll( m_Protocol->SEND_W3GS_PLAYERLEAVE_OTHERS( KickedPlayer->GetPID( ), KickedPlayer->GetLeftCode( ) ) );
				KickedPlayer->SetLeftMessageSent( true );
			}
		}
		 */

	},

	socketServerSetup: function (hostPort) {
		this.socket.on('listening', this.onListening.bind(this));
		this.socket.on('connection', this.onConnection.bind(this));

		this.socket.on('error', this.onError.bind(this));
		this.socket.on('close', this.onClose.bind(this));

		this.socket.listen(hostPort);
	},

	onListening: function () {
		log('BaseGame listening');
	},
	onConnection: function (socket) {
		log('BaseGame Potential Player connected', socket.remoteAddress + ':' + socket.remotePort);

		this.potentials.push(new GamePlayer.Potential(this.protocol, this, socket));
	},
	onError: function () {
		log('BaseGame error', arguments);
	},
	onClose: function () {
		log('BaseGame close', arguments);
	},

	getEmptySlot: function () {

	},

	/**
	 * @param {String} name
	 * @param {Boolean} sensitive
	 */
	getPlayerFromName: function (name, sensitive) {
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
	},

	update: function () {
		var interval = Date.now() - this.lastPingTime;

		if (interval > GAME_REHOST_INTERVAL) { // refresh every 5 sec

			if (!this.countDownStarted) {
				var fixedHostCounter = this.hostCounter & 0x0FFFFFFF;

				var buffer = this.protocol.SEND_W3GS_GAMEINFO(
					this.ghost.tft,
					this.ghost.LANWar3Version,
					Bytes.ArrayUInt32(GameMap.MAPGAMETYPE_UNKNOWN0),
					this.map.getGameFlags(),
					this.map.getWidth(),
					this.map.getHeight(),
					this.gameName,
					this.creatorName,
					Date.now() - this.creationTime,
					this.map.getPath(),
					this.map.getCRC(),
					12,
					12,
					this.hostPort,
					fixedHostCounter
				);

				var socket = this.ghost.udpSocket;

				socket.send(buffer, 0, buffer.length, 6112, 'localhost', function (err, bytes) {
					if (err) {
						throw err;
					}

					log('localhost', 6112, 'BaseGame bytes sent', bytes);
				});
			}

			this.lastPingTime = Date.now();
		}
	}
});

module.exports = BaseGame;
