'use strict';

import {PotentialPlayer} from './PotentialPlayer';

export class GamePlayer extends PotentialPlayer {
    private isLeftMessageSent;

    // @TODO: add PID, nJoinedRealm, string nName, BYTEARRAY nInternalIP, bool nReserved
    constructor(protocol, game, socket) {
        super(protocol, game, socket);

        this.isLeftMessageSent = false;
    }

    // @TODO: implement construct from PotentialPlayer instance
    static fromPotentialPlayer(potential: PotentialPlayer) {

    }

    getIsLeftMessageSent() {
        return this.isLeftMessageSent;
    }

    getPID() {
        return 0
    }
}
