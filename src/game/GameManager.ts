

import {Game} from "./Game";
import {Map} from "./Map";
import {createLoggerFor} from "../Logger";

const {debug, info, error} = createLoggerFor('Bot');

export class GameManager {
    gamePort: any;
    map: Map;
    gameMapName: any;
    gameExiting: boolean;
    game: Game;

    constructor() {

            // if (this.currentGame) {
            //     info('deleting current game in preparation for exiting nicely');
            //     this.currentGame.close();
            //     this.currentGame = null;
            // }

            // if (this.adminGame) {
            //     info('deleting admin game in preparation for exiting nicely');
            //     this.adminGame.close();
            //     this.adminGame = null;
            // }

    }

    update() {
        if (this.game) {
            if (this.game.update()) {
                info('deleting game');
                this.game = null;
                this.gameExiting = true;
            }
        }
    }


    protected gameSetup() {
        info('configure admin game');

        this.map = new Map(this, this.getMapPath(this.gameMapName));

        this.game = new Game(
            this.map,
            null,
            this.gamePort,
            0,
            'Admin Game',
            'JiLiZART'
        );
    }

}