import path from 'path';
import {create} from './Logger';

const {debug, info, error} = create('Plugin');

export class Plugin {
	static loaded = {};

	constructor(config) {
		this.config = config;
	}

	static load(name, config = {}) {
		if (!name) return;

		const requirePath = path.resolve(`./plugins/${name}`);
		let ExportedClass;

		try {
			ExportedClass = require(requirePath)(Plugin);
		} catch (e) {
			error(`failed to load plugin '${name}' by path '${requirePath}'`);
			error(e);
		}

		try {
			let instance = new ExportedClass(config);

			if (instance instanceof Plugin) {
				info(`load "${instance.constructor.name}"`);

				Plugin.loaded[name] = instance;
			} else {
				error(`plugin '${name}' must be an instance of class "Plugin"`);
				instance = null;
			}
		} catch (e) {
			error(`${name}: `, e);
		}
	}

	static emit(eventName, data) {
		Object.keys(Plugin.loaded).forEach((plugName) => {
			let instance = Plugin.loaded[plugName];

			if (typeof instance[eventName] === 'function') {
				instance[eventName](data);
				debug(`emit ${eventName}`);
			}
		})
	}
}