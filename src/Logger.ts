const winston = require('winston');
const chalk = require('chalk');
const util = require('util');
const debuglog = util.debuglog('ghost');
const {GHOST_DEBUG} = process.env;

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

function isoDate() {
	return (new Date(Date.now())).toISOString();
}

function noop() {
}

export function hex(buffer) {
	if (GHOST_DEBUG && GHOST_DEBUG.indexOf('hex') !== -1) {
		require('hex')(buffer);
	}
}

export function create(category): Logger {
	if (GHOST_DEBUG && GHOST_DEBUG.indexOf('log') !== -1) {
		return {
			info: (message, ...vars) => console.log([chalk.gray(isoDate()), chalk.green(category), chalk.blue('info'), message, ...vars].join(' ')),
			debug: (message, ...vars) => console.log([chalk.gray(isoDate()), chalk.green(category), chalk.yellow('debug'), message, ...vars].join(' ')),
			error: (message, ...vars) => console.log([chalk.gray(isoDate()), chalk.green(category), chalk.red('error'), message, ...vars].join(' '))
		} as Logger;
	} else {
		return {
			info: (message, ...vars) => console.log([chalk.gray(isoDate()), chalk.green(category), chalk.blue('info'), message, ...vars].join(' ')),
			debug: noop,
			error: (message, ...vars) => console.log([chalk.gray(isoDate()), chalk.green(category), chalk.red('error'), message, ...vars].join(' '))
		} as Logger;
	}
}
