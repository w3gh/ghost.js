'use strict';

var log = require('./../log');
var util = require('util');
var Bytes = require('./../Bytes');
var bp = require('bufferpack');
var fs = require('fs');
var path = require('path');
var _ = require('lodash');

var GameSlot = require('./GameSlot');

function Map(ghost, path) {
	this.ghost = ghost;

	if (!this.load(path)) {
		this.valid = true;
		this.mapPath = 'Maps\\FrozenThrone\\(12)EmeraldGardens.w3x';
		this.mapSize = Bytes.Extract('174 221 4 0', 4);
		this.mapInfo = Bytes.Extract('251 57 68 98', 4);
		this.mapCRC = Bytes.Extract('108 250 204 59', 4);
		this.mapSHA1 = Bytes.Extract('35 81 104 182 223 63 204 215 1 17 87 234 220 66 3 185 82 99 6 13', 20);

		log('using hardcoded', this.mapPath);

		this.mapSpeed = Map.MAPSPEED_FAST;
		this.mapVisibility = Map.MAPVIS_DEFAULT;
		this.mapObservers = Map.MAPOBS_NONE;
		this.mapFlags = Map.MAPFLAG_TEAMSTOGETHER | Map.MAPFLAG_FIXEDTEAMS;
		this.mapFilterMarker = Map.MAPFILTER_MAKER_BLIZZARD;
		this.mapFilterType = Map.MAPFILTER_TYPE_MELEE;
		this.mapFilterSize = Map.MAPFILTER_SIZE_LARGE;
		this.mapFilterObs = Map.MAPFILTER_OBS_NONE;
		this.mapOptions = Map.MAPOPT_MELEE;

		this.mapWidth = Bytes.Extract('172 0', 2);
		this.mapHeight = Bytes.Extract('172 0', 2);

		this.mapNumPlayer = 12;
		this.mapNumTeams = 1;

		this.slots.push(new GameSlot(0, 255, GameSlot.SLOTSTATUS_OPEN, 0, 0, 0, GameSlot.SLOTRACE_RANDOM | GameSlot.SLOTRACE_SELECTABLE));
		this.slots.push(new GameSlot(0, 255, GameSlot.SLOTSTATUS_OPEN, 0, 1, 1, GameSlot.SLOTRACE_RANDOM | GameSlot.SLOTRACE_SELECTABLE));
		this.slots.push(new GameSlot(0, 255, GameSlot.SLOTSTATUS_OPEN, 0, 2, 2, GameSlot.SLOTRACE_RANDOM | GameSlot.SLOTRACE_SELECTABLE));
		this.slots.push(new GameSlot(0, 255, GameSlot.SLOTSTATUS_OPEN, 0, 3, 3, GameSlot.SLOTRACE_RANDOM | GameSlot.SLOTRACE_SELECTABLE));
		this.slots.push(new GameSlot(0, 255, GameSlot.SLOTSTATUS_OPEN, 0, 4, 4, GameSlot.SLOTRACE_RANDOM | GameSlot.SLOTRACE_SELECTABLE));
		this.slots.push(new GameSlot(0, 255, GameSlot.SLOTSTATUS_OPEN, 0, 5, 5, GameSlot.SLOTRACE_RANDOM | GameSlot.SLOTRACE_SELECTABLE));
		this.slots.push(new GameSlot(0, 255, GameSlot.SLOTSTATUS_OPEN, 0, 6, 6, GameSlot.SLOTRACE_RANDOM | GameSlot.SLOTRACE_SELECTABLE));
		this.slots.push(new GameSlot(0, 255, GameSlot.SLOTSTATUS_OPEN, 0, 7, 7, GameSlot.SLOTRACE_RANDOM | GameSlot.SLOTRACE_SELECTABLE));
		this.slots.push(new GameSlot(0, 255, GameSlot.SLOTSTATUS_OPEN, 0, 8, 8, GameSlot.SLOTRACE_RANDOM | GameSlot.SLOTRACE_SELECTABLE));
		this.slots.push(new GameSlot(0, 255, GameSlot.SLOTSTATUS_OPEN, 0, 9, 9, GameSlot.SLOTRACE_RANDOM | GameSlot.SLOTRACE_SELECTABLE));
		this.slots.push(new GameSlot(0, 255, GameSlot.SLOTSTATUS_OPEN, 0, 10, 10, GameSlot.SLOTRACE_RANDOM | GameSlot.SLOTRACE_SELECTABLE));
		this.slots.push(new GameSlot(0, 255, GameSlot.SLOTSTATUS_OPEN, 0, 11, 11, GameSlot.SLOTRACE_RANDOM | GameSlot.SLOTRACE_SELECTABLE));
	}
}

_.extend(Map, {
	MAPSPEED_SLOW: 1,
	MAPSPEED_NORMAL: 2,
	MAPSPEED_FAST: 3,

	MAPVIS_HIDETERRAIN: 1,
	MAPVIS_EXPLORED: 2,
	MAPVIS_ALWAYSVISIBLE: 3,
	MAPVIS_DEFAULT: 4,

	MAPOBS_NONE: 1,
	MAPOBS_ONDEFEAT: 2,
	MAPOBS_ALLOWED: 3,
	MAPOBS_REFEREES: 4,

	MAPFLAG_TEAMSTOGETHER: 1,
	MAPFLAG_FIXEDTEAMS: 2,
	MAPFLAG_UNITSHARE: 4,
	MAPFLAG_RANDOMHERO: 8,
	MAPFLAG_RANDOMRACES: 16,

	MAPOPT_HIDEMINIMAP: 1 << 0,
	MAPOPT_MODIFYALLYPRIORITIES: 1 << 1,
	MAPOPT_MELEE: 1 << 2,		// the bot cares about this one...
	MAPOPT_REVEALTERRAIN: 1 << 4,
	MAPOPT_FIXEDPLAYERSETTINGS: 1 << 5,		// and this one...
	MAPOPT_CUSTOMFORCES: 1 << 6,		// and this one, the rest don't affect the bot's logic
	MAPOPT_CUSTOMTECHTREE: 1 << 7,
	MAPOPT_CUSTOMABILITIES: 1 << 8,
	MAPOPT_CUSTOMUPGRADES: 1 << 9,
	MAPOPT_WATERWAVESONCLIFFSHORES: 1 << 11,
	MAPOPT_WATERWAVESONSLOPESHORES: 1 << 12,

	MAPFILTER_MAKER_USER: 1,
	MAPFILTER_MAKER_BLIZZARD: 2,

	MAPFILTER_TYPE_MELEE: 1,
	MAPFILTER_TYPE_SCENARIO: 2,

	MAPFILTER_SIZE_SMALL: 1,
	MAPFILTER_SIZE_MEDIUM: 2,
	MAPFILTER_SIZE_LARGE: 4,

	MAPFILTER_OBS_FULL: 1,
	MAPFILTER_OBS_ONDEATH: 2,
	MAPFILTER_OBS_NONE: 4,

	MAPGAMETYPE_UNKNOWN0: 1,			// always set except for saved games?
// AuthenticatedMakerBlizzard = 1 << 3
// OfficialMeleeGame = 1 << 5
	MAPGAMETYPE_SAVEDGAME: 1 << 9,
	MAPGAMETYPE_PRIVATEGAME: 1 << 11,
	MAPGAMETYPE_MAKERUSER: 1 << 13,
	MAPGAMETYPE_MAKERBLIZZARD: 1 << 14,
	MAPGAMETYPE_TYPEMELEE: 1 << 15,
	MAPGAMETYPE_TYPESCENARIO: 1 << 16,
	MAPGAMETYPE_SIZESMALL: 1 << 17,
	MAPGAMETYPE_SIZEMEDIUM: 1 << 18,
	MAPGAMETYPE_SIZELARGE: 1 << 19,
	MAPGAMETYPE_OBSFULL: 1 << 20,
	MAPGAMETYPE_OBSONDEATH: 1 << 21,
	MAPGAMETYPE_OBSNONE: 1 << 22
});

_.extend(Map.prototype, {
	gameFlags: 0,
	slots: [],

	load: function (filename) {
		var filepath = path.join(this.ghost.mapCfgPath, filename + '.json');

		if (! fs.existsSync(filepath)) {
			return false;
		}

		var file = JSON.parse(fs.readFileSync(filepath, 'utf8'));

		this.valid = true;
		this.mapPath = file.path;
		this.mapSize = Array.isArray(file.size) ? new Buffer(file.size) : Bytes.Extract(file.size, 4);
		this.mapInfo = Array.isArray(file.info) ? new Buffer(file.info) : Bytes.Extract(file.info, 4);
		this.mapCRC = Array.isArray(file.crc) ? new Buffer(file.crc) : Bytes.Extract(file.crc, 4);
		this.mapSHA1 = Array.isArray(file.sha1) ? new Buffer(file.sha1) : Bytes.Extract(file.sha1, 20);

		log('using loaded', this.mapPath);

		this.mapSpeed = file.speed;
		this.mapVisibility = file.visibility;
		this.mapObservers = file.observers;
		this.mapFlags = file.flags;
		this.mapFilterMarker = Map.MAPFILTER_MAKER_BLIZZARD;
		this.mapFilterType = Map.MAPFILTER_TYPE_MELEE;
		this.mapFilterSize = Map.MAPFILTER_SIZE_LARGE;
		this.mapFilterObs = Map.MAPFILTER_OBS_NONE;
		this.mapOptions = Map.MAPOPT_MELEE;

		this.mapWidth = Array.isArray(file.width) ? new Buffer(file.width) : Bytes.Extract(file.width, 2);
		this.mapHeight = Array.isArray(file.height) ? new Buffer(file.height) : Bytes.Extract(file.height, 2);

		this.mapNumPlayer = file.players;
		this.mapNumTeams = file.teams;

		for (var slot in file.slots) {
			this.slots.push(new GameSlot(
				slot[0],
				slot[1],
				slot[2],
				slot[3],
				slot[4],
				slot[5],
				slot[6],
				slot[7],
				slot[8]));
		}
	},

	getGameFlags: function () {
		/*
		 Speed: (mask 0x00000003) cannot be combined
		 0x00000000 - Slow game speed
		 0x00000001 - Normal game speed
		 0x00000002 - Fast game speed
		 Visibility: (mask 0x00000F00) cannot be combined
		 0x00000100 - Hide terrain
		 0x00000200 - Map explored
		 0x00000400 - Always visible (no fog of war)
		 0x00000800 - Default
		 Observers/Referees: (mask 0x40003000) cannot be combined
		 0x00000000 - No Observers
		 0x00002000 - Observers on Defeat
		 0x00003000 - Additional players as observer allowed
		 0x40000000 - Referees
		 Teams/Units/Hero/Race: (mask 0x07064000) can be combined
		 0x00004000 - Teams Together (team members are placed at neighbored starting locations)
		 0x00060000 - Fixed teams
		 0x01000000 - Unit share
		 0x02000000 - Random hero
		 0x04000000 - Random races
		 */

		this.gameFlags = 0;

		// speed
		switch (this.mapSpeed) {
			case Map.MAPSPEED_SLOW:
				this.gameFlags = 0x00000000;
				break;
			case Map.MAPSPEED_NORMAL:
				this.gameFlags = 0x00000001;
				break;
			default:
				this.gameFlags = 0x00000002;
				break;
		}

		// visibility

		switch (this.mapVisibility) {
			case Map.MAPVIS_HIDETERRAIN:
				this.gameFlags |= 0x00000100;
				break;
			case Map.MAPVIS_EXPLORED:
				this.gameFlags |= 0x00000200;
				break;
			case Map.MAPVIS_ALWAYSVISIBLE:
				this.gameFlags |= 0x00000400;
				break;
			default:
				this.gameFlags |= 0x00000800;
		}

		// observers

		switch (this.mapObservers) {
			case Map.MAPOBS_ONDEFEAT:
				this.gameFlags |= 0x00002000;
				break;
			case Map.MAPOBS_ALLOWED:
				this.gameFlags |= 0x00003000;
				break;
			case Map.MAPOBS_REFEREES:
				this.gameFlags |= 0x40000000;
				break;
		}

		if (this.mapFlags & Map.MAPFLAG_TEAMSTOGETHER) {
			this.gameFlags |= 0x00004000;
		}
		if (this.mapFlags & Map.MAPFLAG_FIXEDTEAMS) {
			this.gameFlags |= 0x00060000;
		}
		if (this.mapFlags & Map.MAPFLAG_UNITSHARE) {
			this.gameFlags |= 0x01000000;
		}
		if (this.mapFlags & Map.MAPFLAG_RANDOMHERO) {
			this.gameFlags |= 0x02000000;
		}
		if (this.mapFlags & Map.MAPFLAG_RANDOMRACES) {
			this.gameFlags |= 0x04000000;
		}

		return bp.pack('<I', [this.gameFlags]);
	},

	getWidth: function () {
		return this.mapWidth;
	},

	getHeight: function () {
		return this.mapHeight;
	},

	getPath: function () {
		return this.mapPath;
	},

	getCRC: function () {
		return this.mapCRC;
	}
});

module.exports = Map;
