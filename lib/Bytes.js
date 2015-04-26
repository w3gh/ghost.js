'use strict';

/**
 *
 * @param {Array} bytes
 * @returns {Buffer}
 */
function ByteArray(bytes) {
	var buffers = bytes.map(function (el) {
		return new Buffer(el);
	});

	return Buffer.concat(buffers);
}

/**
 * @param {String} text
 * @param {Number} count
 * @returns {Buffer}
 * @constructor
 */
function ByteExtract(text, count) {
	var bytes = text.split(' ').map(function(el) {
		return Number(el);
	});

	if (bytes.length > count || bytes.length < count) {
		throw 'invalid length bytes given, expected ' + count;
	}

    return new Buffer(bytes);
}

module.exports = {
	Array: ByteArray,
	Extract: ByteExtract
};
