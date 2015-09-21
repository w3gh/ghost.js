'use strict';

import { ByteArray } from './../Bytes';

export default class GameSlot {
	constructor(PID, DownloadStatus, SlotStatus, Computer, Team, Colour, Race, ComputerType = 1, Handicap = 100) {
		this.PID = Number(PID);
		this.downloadStatus = Number(DownloadStatus);
		this.slotStatus = Number(SlotStatus);
		this.computer = Number(Computer);
		this.team = Number(Team);
		this.colour = Number(Colour);
		this.race = Number(Race);

		this.computerType = Number(ComputerType);
		this.handicap = Number(Handicap);
	}

	toBytes() {
		return ByteArray([
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
}

Object.assign(GameSlot, {
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