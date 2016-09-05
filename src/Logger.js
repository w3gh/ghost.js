const winston = require('winston');
const chalk = require('chalk');
const util = require('util');
const debuglog = util.debuglog('ghost');
const NODE_DEBUG = process.env.NODE_DEBUG;

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

function isoDate() {
	return (new Date(Date.now())).toISOString();
}

export function hex(buffer) {
	if (NODE_DEBUG && NODE_DEBUG.indexOf('ghost') !== -1) {
		require('hex')(buffer);
	}
}

export function create(category) {
	return {
		info: (message, ...vars) => console.log([chalk.gray(isoDate()), chalk.green(category), chalk.blue('info'), message, ...vars].join(' ')),
		debug: (message, ...vars) => debuglog([chalk.gray(isoDate()), chalk.green(category), chalk.yellow('debug'), message, ...vars].join(' ')),
		error: (message, ...vars) => console.log([chalk.gray(isoDate()), chalk.green(category), chalk.red('error'), message, ...vars].join(' '))
	}
}
