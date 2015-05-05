'use strict';

/**
 * @param {Number} type
 * @param {Number} id
 * @param {Buffer} buffer
 * @constructor
 */
function CommandPacket(type, id, buffer) {
    this.type = type;
	this.id = id;
	this.buffer = buffer;
}

module.exports = CommandPacket;
