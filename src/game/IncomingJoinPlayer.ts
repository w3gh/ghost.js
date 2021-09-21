import {createLoggerFor} from "../Logger";
import { isNameValid } from "../util";

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
		info(`${name} | ${this.getInternalIP()} incoming join: host - ${hostCounter}, entryKey - ${entryKey}`)
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

	isNameValid() {
		return isNameValid(this.name)
	}
}
