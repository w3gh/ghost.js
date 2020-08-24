import * as EventEmitter from 'events';
import * as path from 'path'
import {Config} from './Config';
import {createLoggerFor} from './Logger';
import {Plugin} from './Plugin';
import Timer = NodeJS.Timer;

const {debug, info, error} = createLoggerFor('Bot');
const UPDATE_INTERVAL = 50; //50ms

export class Bot extends EventEmitter {
    cfg: Config;
    plugins: any = {};
    exitingNice: boolean = false;
    exitingNow: boolean = false;
    intervalID: Timer;

    constructor(cfg) {
        super();

        if (!cfg) {
            throw new Error('No config given');
        }

        this.cfg = new Config(cfg);
        this.plugins = this.cfg.item('bot.plugins', {});

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

            if (this.exitingNice) {
                this.exit()
            }
        }, UPDATE_INTERVAL);

        process.on('SIGINT', () => {
            if (!this.exitingNow) {
                info('caught interrupt signal (SIGINT)');
                this.exit()
            }
        });

        process.on('SIGTERM', () => {
            if (!this.exitingNow) {
                info('process exiting (SIGTERM)');
                this.exit()
            }
        });

        return this;
    }

    exit() {
        this.exitingNice = true;
        this.exitingNow = true;
        clearInterval(this.intervalID);
        info('exiting');
        this.emit('update', this);
        this.emit('exit', this);
        setTimeout(() => {
            process.exit(0);
        }, 1000)
    }

    toAbsolutePath(src) {
        return path.resolve(path.join(process.cwd(), src))
    }
}
