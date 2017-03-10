'use strict';

// <I 4 bytes
// <H 2 bytes
//DWORD == 32bit unsigned long int

export type BYTEARRAY = Array<number>;

/**
 * @param {Array} bytes
 * @returns {Buffer}
 */
export function ByteArray(bytes: Array<any>): Buffer {
    return Buffer.concat(
        bytes
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

                throw new Array('ByteArray does not expect element as' + typeof el)
            })
    );
}

/**
 * Check if given buffer have valid length bytes
 * @param {Buffer} buffer
 * @returns {Boolean}
 */
export function ValidateLength(buffer: Buffer): boolean {
    return buffer.length === GetLength(buffer);
}

/**
 * Assigns length of bytes
 * @param {Buffer} buffer
 * @returns {Buffer}
 * @constructor
 */
export function AssignLength(buffer: Buffer): Buffer {
    const len = buffer.length;

    buffer[2] = len % 256;
    buffer[3] = len / 256;

    return buffer;
}

/**
 * @param {Buffer} buffer
 * @returns {Number}
 */
export function GetLength(buffer: Buffer): number {
    return buffer.readUInt8(2);
}

/**
 * Converts hex string as '\x03\x00\x00\x00' to js hex number
 * @param {String} hexString
 * @returns {String}
 */
export function AsHex(hexString: string): string {
    return Buffer.from(hexString).toString('hex');
}

/**
 * Creates 4bytes DWORD UInt32 length Buffer from number
 * @param {Number} num
 * @returns {Buffer}
 */
export function ByteUInt32(num: number): Buffer {
    const buff = Buffer.alloc(4);

    buff.writeUInt32LE(Number(num), 0);

    return buff;
}

/**
 * Creates 4bytes DWORD Int32 length Buffer from number
 * @param {Number} num
 * @returns {Buffer}
 */
export function ByteInt32(num: number): Buffer {
    const buff = Buffer.alloc(4);

    buff.writeInt32LE(Number(num), 0);

    return buff;
}

/**
 * Returns Buffer of null terminated string (CString)
 * @param {String} string
 * @returns {Buffer}
 */
export function ByteString(string: string): Buffer {
    return Buffer.concat([Buffer.from(String(string)), Buffer.from([0])]);
}

/**
 * Returns null terminated string (CString)
 * @param buffer
 * @returns {string}
 * @constructor
 */
export function ByteExtractString(buffer: Buffer) {
    return buffer.toString().split('\x00', 1)[0];
}

/**
 * Extracts bytes seq from string
 * @param {String} text
 * @param {Number} count
 * @returns {Buffer}
 */
export function BytesExtract(text: string, count: number): Buffer {
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
export function ByteHeader(buffer: Buffer): Number {
    return buffer.readInt8(0);
}