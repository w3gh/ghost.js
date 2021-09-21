'use strict';

import {BaseGame} from './BaseGame';
import {GHost} from "../GHost";
import {Bot} from "../Bot";

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
        super(ghost, ghost.hostCounter++, map, saveGame, hostPort, gameState, gameName, ownerName, creatorName, creatorServer);

        this.ghost.on(Bot.EVENT_UPDATE, () => {
            if (this.update()) {
                this.exit();
            }
        });

        this.virtualHostName = '|cFFC04040Admin';
    }
}
