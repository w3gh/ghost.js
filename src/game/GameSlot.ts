'use strict';

import {ByteArray} from './../Bytes';

export class GameSlot {
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

    constructor(public PID,
                public DownloadStatus,
                public Status,
                public Computer,
                public Team,
                public Color,
                public Race,
                public ComputerType = 1,
                public Handicap = 100) {
    }

    toBuffer(): Buffer {
        return ByteArray([
            this.PID,
            this.DownloadStatus,
            this.Status,
            this.Computer,
            this.Team,
            this.Color,
            this.Race,
            this.ComputerType,
            this.Handicap
        ]);
    }
}