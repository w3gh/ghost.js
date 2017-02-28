'use strict';

import {PotentialPlayer} from './PotentialPlayer';

export class GamePlayer extends PotentialPlayer {
	constructor(protocol, game, socket) {
		super(protocol, game, socket);

		this.isLeftMessageSent = false;
	}
}