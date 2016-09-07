'use strict';

// <I 4 bytes
// <H 2 bytes

import bp from 'bufferpack';

/**
 *
 * @param {Array} bytes
 * @returns {Buffer}
 */
export function ByteArray(bytes) {
	return Buffer.concat(bytes
		.filter((el) => el !== false) //filter falsy elements by excluding it
		.map((el) => (
			//if Buffer just return, if Array, create Buffer and return, else just create Buffer
			Buffer.isBuffer(el) ? el : (Array.isArray(el) ? Buffer.from(el) : Buffer.from(el, 'binary'))
		))
	);
}

/**
 * Check if given buffer have valid length bytes
 * @param {Buffer} buffer
 * @returns {Boolean}
 */
export function ValidateLength(buffer) {
	return buffer.length === GetLength(buffer);
}

/**
 * Assigns length of bytes
 * @param {Buffer} buffer
 * @returns {Buffer}
 * @constructor
 */
export function AssignLength(buffer) {
	const len = buffer.length;

	buffer[2] = len % 256;
	buffer[3] = len / 256;

	return buffer;
}

/**
 * @param {Buffer} buffer
 * @returns {Number}
 */
export function GetLength(buffer) {
	return buffer.readUInt8(2);
}

/**
 * Converts hex string as '\x03\x00\x00\x00' to js hex number
 * @param {String} hexString
 * @returns {String}
 */
export function AsHex(hexString) {
	return Buffer.from(hexString).toString('hex');
}

/**
 * Creates UInt32 length Buffer from number
 * @param {Number} num
 * @returns {Buffer}
 */
export function ByteArrayUInt32(num) {
	return Buffer.from([
		num,
		num >> 8,
		num >> 16,
		num >> 24
	]);
}

/**
 * Extracts bytes seq from string
 * @param {String} text
 * @param {Number} count
 * @returns {Buffer}
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