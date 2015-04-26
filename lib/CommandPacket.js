'use strict';

/**
 * @param {Number} type
 * @param {Number} id
 * @param {Buffer} buffer
 * @constructor
 */
function CommandPacket(type, id, buffer) {
    this.type = String.fromCharCode(type);
	this.id = String.fromCharCode(id);
	this.buffer = buffer;
}

module.exports = CommandPacket;
