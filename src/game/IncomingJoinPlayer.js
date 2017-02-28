/**
 *
 * @param {Number} hostCounter
 * @param {Number} entryKey
 * @param {String} name
 * @param {Buffer} internalIPBuffer
 * @constructor
 */
export class IncomingJoinPlayer {
	constructor(hostCounter, entryKey, name, internalIP) {
		this.hostCounter = hostCounter;
		this.entryKey = entryKey;
		this.name = name;
		this.internalIP = internalIP;
	}
}