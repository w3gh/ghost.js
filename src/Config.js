import fs from 'fs';

export default class Config {
	constructor(configPath) {
		if (typeof configPath === 'string') {
			this.data = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
		}

		this.data = Object.assign({}, configPath);
	}

	item(name, def) {
		let curr = this.data;
		let names = name.split('.');

		for (let n of names) {
			curr = curr[n];

			if (typeof curr === 'undefined') return def;
		}

		return curr ? curr : def;
	}
}