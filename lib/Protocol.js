'use strict';

var _ = require('lodash');
var bp = require('bufferpack');

export default class Protocol {
	/**
	 * @param {Buffer} buffer
	 * @returns {Boolean}
	 */
	validateLength(buffer) {
		return buffer.length === this.getLength(buffer);
	}

	/**
	 * @param {Buffer} buff
	 * @returns {Buffer}
	 */
	assignLength(buff) {
		var len = buff.length;

		// insert the actual length of the content array into bytes 3 and 4 (indices 2 and 3)
		if (len >= this.minLength && len <= this.maxLength) {
			var packed = bp.pack('<H', [len]).toJSON();

			buff[2] = packed[0];
			buff[3] = packed[1];
		} else {
			throw 'game protocol buffer length error, given ' + len;
		}

		return buff;
	}

	/**
	 * @param {Buffer} buffer
	 * @returns {number}
	 */
	getLength(buffer) {
		var length = 0;
		var bytesArray = buffer.toJSON();
		var bytes = [];

		// verify that bytes 3 and 4 (indices 2 and 3) of the content array describe the length
		if (buffer.length >= this.minLength && buffer.length <= this.maxLength) {
			bytes.push(bytesArray[2]);
			bytes.push(bytesArray[3]);
			length = bp.unpack('<H', new Buffer(bytes))[0];
		}

		return length;
	}
}

Protocol.minLength = 4;
Protocol.maxLength = 65535;
