import path from 'path';
import Config from './Config';
import dgram from 'dgram';

export default class Bot {
	constructor(cfg) {
		if (!cfg) {
			throw new Error('No config given');
		}

		this.cfg = new Config(cfg);
	}


	getMapPath = (filename) => path.resolve(path.join(this.mapCfgPath, `${filename}.json`));
}