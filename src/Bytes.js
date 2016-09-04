'use strict';

import bp from 'bufferpack';

/**
 *
 * @param {Array} bytes
 * @returns {Buffer}
 */
export function ByteArray(bytes) {
	return Buffer.concat(bytes.map((el) => {
		if (Buffer.isBuffer(el)) {
			return el;
		}

		if (Array.isArray(el)) {
			return Buffer.from(el);
		} else {
			return Buffer.from(el, 'binary');
		}
	}));
}

/**
 * Assigns length of bytes
 * @param buff
 * @returns {*}
 * @constructor
 */
export function AssignLength(buff) {
	var len = buff.length;
	// l = len(p)
	//   #p[2] = l % 256
	//   #p[3] = l / 256
	//   p[2:4] = pack('<H', l)
	// arr.splice(2, 1, l.toString(16));

	buff[2] = len % 256;
	buff[3] = len / 256;

	//buff.write(len.toString(16), 2, 'hex');

	return buff;
}

export function ByteArrayUInt32(num) {
	var result = [];

	result.push(num);
	result.push(num >> 8);
	result.push(num >> 16);
	result.push(num >> 24);

	return Buffer.from(result);
}

/**
 * Extracts bytes seq from string
 * @param {String} text
 * @param {Number} count
 * @returns {Buffer}
 * @constructor
 */
export function BytesExtract(text, count) {
	var bytes = text.split(' ').map(function (el) {
		return String(el);
	});

	if (bytes.length > count || bytes.length < count) {
		throw 'invalid length bytes given ' + bytes.length + ', expected ' + count;
	}

	return new Buffer(bytes);
}

/**
 * Returns array of bytes of null terminated string
 * @param {String} string
 * @returns {Array}
 */
export function ByteString(string) {
	var buffArray = Buffer.from(string).toJSON();
	buffArray.data.push(0); // all strings need to be null terminated

	return buffArray.data;
}

/**
 * @param {Buffer} buffer
 * @returns {Number}
 * @constructor
 */
export function ByteHeader(buffer) {
	var byteArray = buffer.toJSON();
	return Number(byteArray.data[0]);
}

// <I 4 bytes
// <H 2 bytes
