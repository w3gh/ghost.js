'use strict';

import {BaseGame} from './BaseGame';
import {GHost} from "../GHost";

export class AdminGame extends BaseGame {
    constructor(public ghost: GHost,
                map,
                public saveGame = null,
                public hostPort: number,
                public gameState: number,
                public gameName: string,
                public ownerName: string,
                public creatorName = 'JiLiZART',
                public creatorServer: string = '') {
        super(ghost, 1, map, saveGame, hostPort, gameState, gameName, ownerName, creatorName, creatorServer);

        this.virtualHostName = '|cFFC04040Admin';
    }
}
