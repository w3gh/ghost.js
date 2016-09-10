import EventEmitter from 'events';
import Config from './Config';
import {create} from './Logger';

const {debug, info, error} = create('Bot');
const UPDATE_INTERVAL = 50; //50ms

export default class Bot extends EventEmitter {
	constructor(cfg) {
		super();

		if (!cfg) {
			throw new Error('No config given');
		}

		this.cfg = new Config(cfg);

		this.exiting = false;
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