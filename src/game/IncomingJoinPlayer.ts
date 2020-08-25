import {createLoggerFor} from "../Logger";

const {debug, info, error} = createLoggerFor('IncomingJoinPlayer');

/**
 *
 * @param {Number} hostCounter
 * @param {Number} entryKey
 * @param {String} name
 * @param {Buffer} internalIPBuffer
 * @constructor
 */
export class IncomingJoinPlayer {
	constructor(public hostCounter, public entryKey, public name, public internalIP) {
		info(`${this.name} | ${this.getInternalIP()} incoming join (${this.entryKey})`)
	}

	getName() {
		return this.name
	}

    getHostCounter() {
	    return this.hostCounter
    }

	getInternalIP() {
		return this.internalIP.toJSON().data.join('.')
	}
}
