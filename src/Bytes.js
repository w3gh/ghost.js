'use strict';

// <I 4 bytes
// <H 2 bytes
//DWORD == 32bit unsigned long int
/**
 *
 * @param {Array} bytes
 * @returns {Buffer}
 */
export function ByteArray(bytes) {
	return Buffer.concat(bytes
		.filter((el) => el !== false) //filter falsy elements by excluding it
		.map((el) => {
			if (Buffer.isBuffer(el)) {
				return el;
			}

			if (Number.isInteger(el)) {
				return Buffer.from([el]);
			}

			if (Array.isArray(el)) {
				return Buffer.from(el);
			}

			if (typeof el === 'string') {
				return Buffer.from(el, 'binary');
			}

			console.error('ByteArray does not expect element as', el);
		})
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
 * Creates 4bytes DWORD UInt32 length Buffer from number
 * @param {Number} num
 * @returns {Buffer}
 */
export function ByteUInt32(num) {
	const buff = Buffer.alloc(4);

	buff.writeUInt32LE(Number(num), 0);

	return buff;
}

/**
 * Creates 4bytes DWORD Int32 length Buffer from number
 * @param {Number} num
 * @returns {Buffer}
 */
export function ByteInt32(num) {
	const buff = Buffer.alloc(4);

	buff.writeInt32LE(Number(num), 0);

	return buff;
}

/**
 * Returns Buffer of null terminated string (CString)
 * @param {String} string
 * @returns {Buffer}
 */
export function ByteString(string) {
	return Buffer.concat([Buffer.from(String(string)), Buffer.from([0])]);
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

	return Buffer.from(bytes);
}

/**
 * @param {Buffer} buffer
 * @returns {Number}
 * @constructor
 */
export function ByteHeader(buffer) {
	return buffer.readInt8(0);
}