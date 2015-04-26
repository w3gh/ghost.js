'use strict';

var log = require('./../log');
var util = require('util');
var Bytes = require('./../Bytes');
var _ = require('lodash');

function GameSlot(PID, DownloadStatus, SlotStatus, Computer, Team, Colour, Race, ComputerType, Handicap) {
	this.PID = Number(PID);
	this.downloadStatus = Number(DownloadStatus);
	this.slotStatus = Number(SlotStatus);
	this.computer = Number(Computer);
	this.team = Number(Team);
	this.colour = Number(Colour);
	this.race = Number(Race);

	ComputerType = ComputerType || 1;
	this.computerType = Number(ComputerType);
	Handicap = Handicap || 100;
	this.handicap = Number(Handicap);
}

_.extend(GameSlot, {
	SLOTSTATUS_OPEN: 0,
	SLOTSTATUS_CLOSED: 1,
	SLOTSTATUS_OCCUPIED: 2,

	SLOTRACE_HUMAN: 1,
	SLOTRACE_ORC: 2,
	SLOTRACE_NIGHTELF: 4,
	SLOTRACE_UNDEAD: 8,
	SLOTRACE_RANDOM: 32,
	SLOTRACE_SELECTABLE: 64,

	SLOTCOMP_EASY: 0,
	SLOTCOMP_NORMAL: 1,
	SLOTCOMP_HARD: 2
});

_.extend(GameSlot.prototype, {
	toBytes: function () {
		return Bytes.Array([
			this.PID,
			this.downloadStatus,
			this.slotStatus,
			this.computer,
			this.team,
			this.colour,
			this.race,
			this.computerType,
			this.handicap
		]);
	}
});

module.exports = GameSlot;
