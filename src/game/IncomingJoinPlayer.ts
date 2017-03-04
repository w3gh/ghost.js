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
	}
}