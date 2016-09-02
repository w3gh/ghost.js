'use strict';

import {ByteArray} from './../Bytes';

export default class GameSlot {
	static STATUS_OPEN = 0;
	static STATUS_CLOSED = 1;
	static STATUS_OCCUPIED = 2;

	static RACE_HUMAN = 1;
	static RACE_ORC = 2;
	static RACE_NIGHTELF = 4;
	static RACE_UNDEAD = 8;
	static RACE_RANDOM = 32;
	static RACE_SELECTABLE = 64;

	static COMP_EASY = 0;
	static COMP_NORMAL = 1;
	static COMP_HARD = 2;

	constructor(PID, DownloadStatus, STATUS, Computer, Team, Colour, Race, ComputerType = 1, Handicap = 100) {
		this.PID = Number(PID);
		this.downloadStatus = Number(DownloadStatus);
		this.STATUS = Number(STATUS);
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
			this.STATUS,
			this.computer,
			this.team,
			this.colour,
			this.race,
			this.computerType,
			this.handicap
		]);
	}
}

Object.assign(GameSlot, {});