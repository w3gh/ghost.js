'use strict';

/**
 *
 * @param {Array} bytes
 * @returns {Buffer}
 */
export function ByteArray(bytes) {
	var buffers = bytes.map(function (el) {
		return new Buffer(el);
	});

	return Buffer.concat(buffers);
}

export function ByteArrayUInt32(num) {
	var result = [];

	result.push(num);
	result.push(num >> 8);
	result.push(num >> 16);
	result.push(num >> 24);

	return new Buffer(result);
}

/**
 * Extracts bytes seq from string
 * @param {String} text
 * @param {Number} count
 * @returns {Buffer}
 * @constructor
 */
export function ByteExtract(text, count) {
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
	var buffArray = (new Buffer(string)).toJSON();
	buffArray.push(0); // all strings need to be null terminated

	return buffArray;
}

/**
 * @param {Buffer} buffer
 * @returns {Number}
 * @constructor
 */
export function ByteHeader(buffer) {
	var byteArray = buffer.toJSON();
	return Number(byteArray[0]);
}

// <I 4 bytes
// <H 2 bytes
