import {ByteDecodeToString} from "./Bytes";

const chalk = require('chalk');
const debug = require('debug');
const util = require('util');
const {GHOST_DEBUG} = process.env;

debug.enable('ghost:*');

// { emerg: 0, alert: 1, crit: 2, error: 3, warning: 4, notice: 5, info: 6, debug: 7 }

// black
// red
// green
// yellow
// blue
// magenta
// cyan
// white
// gray

interface Logger {
    info(message, ...vars)

    debug(message, ...vars)

    error(message, ...vars)
}

function noop() {
}

function objectFromKeysAndValues(keys, values) {
    return keys.reduce((obj, key, idx) => {
        obj[key] = values[idx];
        return obj
    }, {})
}

function mapVars(vars: any[]) {
    return vars.map(item => {
        if (Buffer.isBuffer(item)) {
            return ByteDecodeToString(item)
        }

        if (typeof item === "object" && item !== null) {
            return util.inspect(
                objectFromKeysAndValues(
                    Object.keys(item),
                    mapVars(Object.values(item))
                ),
				{
					colors: true,
					compact: true,
					breakLength: Infinity,
				}
            )
        }

        return item
    })
}

export function hex(buffer) {
    if (GHOST_DEBUG && GHOST_DEBUG.indexOf('hex') !== -1) {
        require('hex')(buffer);
    }
}

export function createLoggerFor(category): Logger {
    const logger = debug('ghost:' + category);
    const info = (message, ...vars) => logger([message, ...mapVars(vars)].join(' '));
    const error = (message, ...vars) => logger([chalk.red(message), ...mapVars(vars)].join(' '));

    if (GHOST_DEBUG && GHOST_DEBUG.indexOf('log') !== -1) {
        return {
            info,
            debug: (message, ...vars) => logger([chalk.yellow(message), ...mapVars(vars)].join(' ')),
            error
        } as Logger;
    } else {
        return {
            info,
            debug: noop,
            error
        } as Logger;
    }
}
