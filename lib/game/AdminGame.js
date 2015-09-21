'use strict';

import BaseGame from './BaseGame';

export class AdminGame extends BaseGame {
	constructor({ghost, map, saveGame, hostPort, gameState, gameName, ownerName, creatorName, creatorServer}) {
		super({ghost, map, saveGame, hostPort, gameState, gameName, ownerName, creatorName, creatorServer});
		
		this.virtualHostName = '|cFFC04040Admin';
	}
}
