'use strict';

import {BaseGame} from './BaseGame';
import {GHost} from "../GHost";

export class AdminGame extends BaseGame {
    constructor(ghost: GHost,
                map,
                saveGame = null,
                hostPort: number,
                gameState: number,
                gameName: string,
                ownerName: string,
                creatorName = 'JiLiZART',
                creatorServer: string = '') {
        super(ghost, 1, map, saveGame, hostPort, gameState, gameName, ownerName, creatorName, creatorServer);

        this.virtualHostName = '|cFFC04040Admin';
    }
}
