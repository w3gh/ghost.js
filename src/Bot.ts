import * as EventEmitter from 'events';
import {Config} from './Config';
import {create} from './Logger';
import {Plugin} from './Plugin';
import Timer = NodeJS.Timer;

const {debug, info, error} = create('Bot');
const UPDATE_INTERVAL = 50; //50ms

export class Bot extends EventEmitter {
    cfg: Config;
    plugins: any;
    exiting: boolean;
    intervalID: Timer;

    constructor(cfg) {
        super();

        if (!cfg) {
            throw new Error('No config given');
        }

        this.cfg = new Config(cfg);
        this.plugins = this.cfg.item('bot.plugins');

        this.exiting = false;

        this.loadPlugins();
    }

    loadPlugins() {
        Object.keys(this.plugins).forEach((key) => {
            Plugin.load(key, this.plugins[key]);
        });

        Plugin.emit('onInit', this);
    }

    start(): this {
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