import EventEmitter from 'events';
import {Config} from './Config';
import {create} from './Logger';
import {Plugin} from './Plugin';

const {debug, info, error} = create('Bot');
const UPDATE_INTERVAL = 50; //50ms

export class Bot extends EventEmitter {
	constructor(cfg) {
		super();

		if (!cfg) {
			throw new Error('No config given');
		}

		const config = new Config(cfg);

		this.cfg = config;
		this.plugins = config.item('bot.plugins');

		console.log('admingame', config.item('admingame'));

		this.exiting = false;

		this.loadPlugins();
	}

	loadPlugins() {
		console.log('plugs', this.plugins);

		Object.keys(this.plugins).forEach((key) => {
			console.log('load', key, this.plugins[key]);


			Plugin.load(key, this.plugins[key]);
		});

		Plugin.emit('onInit', this);
	}

	start() {
		this.intervalID = setInterval(() => {
			this.emit('update', this);

			if (this.exiting) {
				this.emit('exit', this);
				process.exit(0);
				clearInterval(this.intervalID);
			}
		}, UPDATE_INTERVAL);

		process.on('SIGTERM', function () {
			info('process exiting');
			this.exiting = true;
		});

		return this;
	}
}